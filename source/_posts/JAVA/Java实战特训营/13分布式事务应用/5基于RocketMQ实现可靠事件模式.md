---
title: 5基于RocketMQ实现可靠事件模式
description: 5基于RocketMQ实现可靠事件模式
date: 2024-11-24 15:35:53
tags:
---

学习目标
- 理解可靠事件模式的结构和原理
- 掌握基于RocketMO实现可靠事件模式的方法

目录
- 可靠事件模式
- RocketMO事务消息
- 基于RocketMO实现可靠事件

# 可靠事件模式
关键点：保证业务操作和发布消息的原子性（同时成功/失败）

## 问题
本地更新后消息发布失败
消息发布事件成功，中间件推送失败
重复消费，幂等性保证

## 技术组件
- 本地事件表，保存事件
业务操作时需要将业务数据和事件保存在同一个本地事务中
- 事件确认组件，重发事件
事件确认表现为一种定时机制，用于处理事件没有被成功发送的场景
- 事件恢复组件，更新事件状态 
事件恢复组件同样是一种定时机制，根据本地事件表中的事件状态，专门处理状态为已确认但已超时的事件

异常场景：
1. 消息队列将支付成功消息返回订单服务时，网络错误，订单服务无法收到支付成功消息，导致订单数据回滚，支付服务数据正常入库。
2. 消息队列将支付成功消息返回订单服务时，订单服务挂了，导致订单数据库无法提交事务而回滚，支付服务数据正常入库。

# RocketMO事务消息
- 消息发送方
解决执行本地事务与发送消息的原子性问题
保证本地事务执行成功，消息一定发送成功
- 消息接收方
解决接收消息与本地事务的原子性问题
保证接收消息成功后，本地事务一定执行成功

半消息：broker确认前，消费者看不到

**事务消息发布流程**
![](5-事务消息发布流程.png)
- 发送方发送一个事务消息给Broker，此时这条消息暂时不能被接收方消费，即半消息
- Broker返回发送成功给发送方
- 发送方执行本地事务，例如操作数据库
- 如果本地事务执行成功，发送commit给Broker，这条消息就可以被接收方消费;如果本地事务执行失败，发送rollback给Broker，RocketMO会删除这条消息
- 如果发送方在本地事务过程中，出现服务挂掉，网络闪断或者超时，那Broker将无法收到确认结果
- 此时RocketMO将会不停的询问发送方来获取本地事务的执行状态，即事务回查
- 根据事务回查的结果来决定Commit或Rollback，这样就保证了消息发送与本地事务同时成功或同时失败

 
# 实现 - 基于RocketMO实现可靠事件
**前提**
创建"事务执行记录表"
作用：
1. 事务回查 
2. 业务层幂等性控制

```
CREATE TABLE`ticket_tx_record`(
    tx no`varchar(64)NOT NULL COMMENT'事务Id',
    create time` datetime NOT NULL DEFAULT CURRENT TIMESTAMP COMMENT'创建时间,
    PRIMARY KEY('tx no'
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='事务记录表
CREATE TABLE`chat_tx_record`(
    tx no`varchar(64)NOT NULL COMMENT'事务Id',
    create time` datetime NOT NULL DEFAULT CURRENT TIMESTAMP COMMENT'创建时间,
    PRIMARY KEY('tx no'
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='事务记录表
```

## 服务提供者实现

业务服务类
- 发送消息（到broker）
- 执行本地事务，幂等处理
TransactionListener实现类
- （收到borker消息）事务执行（调用业务服务类）
- 事务状态回查

## 服务消费者实现

## 示例
### 生产者

```
public class customerTicketServiceImpl{
    @Override
    public void generateTicket (AddCustomerTicketReqV0 addCustomerTicketReqVO){
        //从VO中创建TicketGeneratedEvent
        TicketGeneratedEvent ticketGeneratedEvent = createTicketGeneratedEvent (addCustomerTicketReqVO);
        //将Event转为JSON对象
        JSONObject jsonObject = new JSONObject();
        jsonObject.put ("ticketGeneratedEvent", ticketGeneratedEvent)
        String isonString= isonObject.toJSONString():
        //生成消息对象
        Message<String> messageageBuilder.withPayload(jsonString).build();
        //发送事务信息
        rocketMgTemplate.sendMessageInTransaction("producer_group_ticket","topic_ticket",null);
        //此时是半消息，消费者看不到,broker收到后需执行本地事务executeLocalTransaction
    }

    private TicketGeneratedEvent createTicketGeneratedEvent (AddCustomerTicketReqVO addCustomerTicketReqVO) {
        TicketGeneratedEvent ticketGeneratedEvent = new TicketGeneratedEvent();
        //创建一个全局事务
        String txNo = "TX-" + DistributedId. getInstance().getFastSimpleUUID();
        ticketGeneratedEvent.setTxNo(txNo);
        //创建一个全局工单编号，和聊天记录进行关联
        String ticketNo ="TICKET-" + DistributedId. getInstance().getFastSimpleUUID();
        ticketGeneratedEvent.setTicketNo(ticketNo);        
        ticketGeneratedEvent.setUserId(addCustomerTicketReqVO.getUserId());
        ticketGeneratedEvent.setStaffId(addCustomerTicketReqVO.getStaffId());
        ticketGeneratedEvent.setInquire(addCustomerTicketReqVO.getInquire());
        return ticketGeneratedEvent;
    }

    @Override
    @Transactional //本地事务
    public void doGenerateTicket (TicketGeneratedEvent ticketGeneratedEvent){
        //幂等判断
        if(Objects. nonNu11(txRecordMapper,findTxRecordByTxNo(ticketGeneratedEvent.getTxNo()))){
            return;
        }
        //插入工单
        CustomerTicket customerTicket = CustomerTicketConverter.INSTANE.convertEvent(ticketGeneratedEvent);
        customerTicket.setStatus(1);
        save(customerTicket);
        //添加事务执行日志
        txRecordMapper.addTxRecord(ticketGeneratedEvent);
    }
}

// Evnet
@Component
@RocketMQTransactionListener(txProducerGroup ="product_ group_ticket”)
public class Productlistener implements RocketMGLocalTransactionlistener {
    @Override
    public RocketMQLocalTransactionState executeLocalTransaction(Message msg, Object arg){
        try{
            //解析消息，转化为Event对象
            TicketGeneratedEvent ticketGeneratedEvent = convertEvent(msg):
            //执行本地事务(插入工单记录) 
            customerTicketService.doGenerateTicket(ticketGeneratedEvent);、、
            //提交Commit状态，确保对于消费者可见
            return RocketMgLocalTransactionState.COMMIT;
        }
        catch(Exception e){
            e.printStackTrace();  
            //如果本地事务执行失败，那么将消息设置为回滚状态，消费者就不可见            
            return RocketMQLocalTransactionState.ROLLBACK;
        }
    }

    @Override
    public RocketMQLocalTransactionState checkLocalTransaction(Message msg){
        //解析消息，转化为Event对象
        TicketGeneratedEvent ticketGeneratedExent = convertEvent(msg);
        Boolean isTxloExisted = Objects.nonNull(txRecordMapper. findTxRecordByTxNo(ticketGeneratedEvent.getTxNo()));
        //如果事务已经执行则返回COMMIT，如果没有执行就返回UNKNOWN状态
        if(isTxNoExisted){
            return RocketMQLocalTransactionState.COMMIT;
        } else {
            return RocketMQLocalTransactionState.UNKNOWN;
        }
    }
}

public class TicketGeneratedEvent{
    private String ticketNo;
    private long userId;
    private Long staffld;
    private Long content;
    private Long txNo; //事务编号
}


```
### 消费者
```
//监听器
@Component
@Slf4j
@RocketMGMessagelistener(consumerGroup = "consumer_group_ticket", topic = "topic_ticket”)
public class Consumer implements RocketMQListener<String> {
    @Override
    public void onMessage(String message){
        //解析消息
        JSONObject jsonObject =JSONObject.parseObject(message);
        String eventString = jsonObject.getString("ticketGeneratedEvent");
        //转成Event
        TicketGeneratedEvent ticketGeneratedEvent = jSONObject.parseObject(eventString, TicketGeneratedEvent.class);
        //添加本地聊天记录
        chatRecordService.generateChatRecord(ticketGeneratedEvent);
    }
}

//服务提供者 
public class ChatRecordServiceImpl{
    @Override
    public void generateChatRecord(TicketGeneratedEvent ticketGeneratedEvent){
        //幂等判断
        if (Objects.nonNull(txRecordMapper.findTxRecordByTxNo(ticketGeneratedEvent.getTxNo()))){
            return;
        }
        //插入聊天记录
        ChatRecord chatRecord = RecordConverter.INSTANCE.convertEvent(ticketGeneratedEvent);
        save(chatRecord);
        //添加事务执行日志
        txRecordMapper.addTxRecord(ticketGeneratedEvent.getTxNo());
    }
}


@Mаpрer
public interface ChatRecordConverter{
    ChatRecordConverter INSTANCE=Mappers.getMapper(ChatRecordConverter.class);
    //Event->Entity
    ChatRecord convertEvent(TicketGeneratedEvent event);
}
```



# 思考题
RocketMO事务消息如何确保消息发布和消息消费的事务性?

