---
title: 3基于Seata实现TCC分布式事务
description: 3基于Seata实现TCC分布式事务
date: 2024-11-24 15:35:40
tags:
---

- TCC模式组成结构
- TCC模式实现方式



# TCC模式组成结构
Try|Confirm|Cancel
包含一个主服务和若干从服务，主服务发起流程，从服务提供try,confirm,cancel三个接口

try:预留业务资源，完成业务规则检查（预处理如检查库存有没有）
confirm:真正执行业务
cancel:释放try阶段预留的业务资源

## 场景分析
- 资源是什么?
发生了变化的主体订单会新增，库存会扣减
- 业务检查是什么?
订单新增:不需要检查库存扣减:判断是否足够
- 如何预留资源?
订单:新增但不生效，如设置状态库存:对要扣减的库存进行冻结

|阶段|  | 订单 | 库存 |
| --- | --- | --- | --- | 
| 1 | try | 新增但不生效，如设置状态 | 对要扣减的库存进行冻结 |
| 1 | confirm | 更新为已生效的状态，暴露给前端 | 冻结的库存取消冻结，正式扣减 |
| 2 | cancel | 更新为已失效的状态 | 取消冻结的库存 |

# TCC模式实现方式
![](3-TCC模式角色交互.png)
- TM 
包含@GlobalTransactional注解定义全局事务的范围，启动、提交或回滚全局事务
- RM
提供TCC服务，与TC交互并注册分支事务并驱动分支事务的提交或回滚
- TC
维护全局和分支事务的状态驱动全局事务提交或回滚

## 使用
### 核心注解
```
@LocalTCC
public interface CreateChatTccAction{
    @TwoPhaseBusinessAction(name =TccAction",commitMethod ="commit",rollbackMethod ="rollback")
    boolean prepare(BusinessActionContext actionContext, @BusinessActionContextParameter(paramName ="param'')String param)throws BizException;

    boolean commit(BusinessActionContext actionContext);
     
    boolean rollback(BusinessActionContext actionContext);
}
```

`@LocalTCC`注解，用来修饰实现了二阶段提交的本地TCC接口
`@TwoPhaseBusinessAction`注解标识当前方法使用TCC模式管理事务提交
`@BusinessActionContextParamete`注解，用来在上下文中传递参数

业务表新增TCC状态列 初始化、确认、回滚

### 异常处理
针对网络不可用或时延等不可控的异常情况：
- 幂等操作 
- TCC空回滚
- TCC倒悬

#### 幂等性
在 commit/cancel阶段，因为TC没有收到分支事务的响应会发起重试，这就需要RM支持幂等。如果二阶段接口不能保证幂等性，则会造成资源的重复使用或者重复释放。
#### TCC空回滚
TCC空回滚是在没有执行try方法的情况下，TC下发了回滚指令并执行了cancel逻辑

**应对策略**
- 简单应对策略
如果资源未被锁定或者压根不存在，可以认为try阶段没有执行成功
- 正规应对策略
判断资源是否被锁定 引入独立的事务控制表，在try阶段中将XID和分支事务ID落表保存
如果查不到事务控制记录，那么就说明try阶段未被执行

#### TCC倒悬
又叫悬挂，三个阶段没有按照先后顺序执行
判断事务是否已执行（查询transaction表）

# 思考题
虽然TCC是一种常用的分布式事务模式，但你认为该模式存在哪些缺点?




