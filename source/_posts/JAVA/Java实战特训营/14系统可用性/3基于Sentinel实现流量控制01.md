---
title: 3基于Sentinel实现流量控制01
description: 3基于Sentinel实现流量控制01
date: 2024-11-29 17:16:09
tags:
---
学习目标
- 理解Sentinel系统可用性解决方案
- 掌握基于Sentinel的服务限流实现方法

目录
- Sentinel核心概念和工作流程
- Sentinel基本限流机制
- Sentinel热点参数限流

# Sentinel核心概念和工作流程
alibaba开源的高可用流量管理框架
提供面相分布式服务架构的高可用流量防护组件，主要以流量为切入点，多维度保障微服务稳定性
## Sentinel的解决方案
- 限流
- 熔断降级
- 塑性
- 负载保护

### Sentinel功能特性
![](Sentinel功能特性.png)
### Setinel开源生态
![](Setinel开源生态.png)
### Setinel模块结构
![](Setinel模块结构.png)

## 核心概念
### 资源
Java应用程序中的任何内容，如一个方法、一段代码-个服务等，一般指一个具体的接口
### 指标数据
Sentinel以资源为维度统计指标数据，这些指标包括每秒请求数、请求平均耗时、每秒异常总数等，
### 规则
围绕资源的实时指标数据设定的规则，可以包括流量控制规则、熔断降级规则以及系统保护规则等
### ProcessorSlot
处理器插槽是Sentinel提供的插件，负责执行具体的资源指标数据的统计、限流、熔断降级、系统自适应保护等工作。
一组处理器插槽表现为有序的处理器插槽链表(ProcessorSlotChain)，Sentinel在执行方法之前根据ProcessorSlotChain调度处理器插槽完成资源指标数据的统计、限流、熔断降级等
![](ProcessorSlot.png)

**ProcessorSlot定义**
```
interface ProcessorSlot<T>{
    //执行entry 方法来启动各个节点对该资源本次访问的数据度量的开始和结束
    void entry(...);
    void exit(...);
    //表示该Slot的entry或exit方法已经执行完毕，可以将entry对象传递给下一个Slot
    void fireEntry(...);
    void fireExit(...);
}
```
#### 内置ProcessorSlot
|Processorslot名称|Processorslot作用|
|---|---|
|NodeSelectorSlot|用于构建调用树中的Node|
|ClusterBuilderSlot|创建CluserNode，具有相同名称的资源共享一个ClusterNode|
|LogSlot|用于打印异常日志|
|StatisticSlot|用于统计实时的调用数据|
|SystemSlot|用于根据Statisticslot所统计的全局入口流量进行限流|
|AuthoritySlot|用于对资源的黑白名单做检查，只要有一条不通过就抛异常|
|FlowSlot|用于根据预设资源的统计信息，按照固定的次序执行限流规则|
|Degradeslot|用于基于统计信息和设置的降级规则进行匹配校验以决定是否降级|

#### ProcessorSlotChain
```
public abstract class ProcessorSlotChain extends  AbstractLinkedProcessorSlot<Object>{
    public abstract void addFirst(AbstractLinkedProcessorSlot<?>protocolProcessor);
    public abstract void addLast(AbstractLinkedProcessorSlot<?>protocolProcessor);
}
public class DefaultProcessorSlotChain extends ProcessorSlotChain {
    public void addFirst(AbstractLinkedProcessorSlot<?>protocolProcessor){
        protocolProcessor.setNext(this.first.getNext());this.first.setNext(protocolProcessor);
        if(this.end == this.first){
            this.end = protocolProcessor;
        }
    }

    public void addLast(AbstractLinkedProcessorslot<?>protocolProcessor){
        this.end.setNext(protocolProcessor);
        this.end = protocolProcessor;
    }
}
```
## 指标数据统计 
### ResourceWrapper
```
public abstract class ResourceWrapper {
    protected final String name; //资源名称
    protected final EntryType entryType; //流量类型
    protected final int resourceType; //资源类型
}
public enum EntryType {
    IN， //流入流量
    OUT;//流出流量
}


public final class ResourceTypeConstants {
    public static final int COMMON=0;//默认，可以是接口、一个方法、一段代码。
    public static final int COMMON_WEB = 1; //Web应用的接口
    public static final int COMMON_RPC =2; //使用Dubbo框架实现的RPC接口
    public static final int COMMONAPI_GATEWAY = 3;//网关接口
    public static final int COMMON_DB_SOL= 4;//数据库SQL操作
}
```
### Node
Node定义统计资源实时指标数据的方法，不同实现类被用在不同维度为资源统计实时指标数据

StatisticNode extends Node 封装实现实时指标数据统计
DefaultNode extends StatisticNode 统计同一资源、不同调用链入口的实时指标数据
ClusterNode extends StatisticNode 统计每个资源的全局指标数据
EntranctNode extends ClusterNode 调用链入口节点（入口，不代表资源）



统计实现通过滑动窗口
### Entry
在调用链上，一个资源对应一个Entry实例 
### Context
## Sentinel工作流程
```
public class sentinelDemo {
    public static void main(String[] args){
        initRules(); //配置规则
        String resourceName:="resource";
        Entry entry = null;
        try {
            //注册资源
            entry = SphU.entry(resourceName);
            //执行业务逻辑
            doBusinessLogic();
        } catch (BlockException e){
            //处理限流
            handleBlockException();
        } finally {
            if(entry != null){
                //退出数据度量
                entry.exit();
            }
        }
    }
}
```
|流程名|释义|
|---|---|
|定义规则|根据业务需求定义规则，包括限流规则、熔断规则和降级规则等|
|注册资源|将需要限流或熔断的资源(如接口、方法等)注册到Sentinel中|
|调用链路拦截|在业务代码中调用需要进行限流或熔断的资源时Sentinel会拦截请求进行规则匹配和统计|
|执行处理|根据规则匹配的结果Sentinel可以进行限流、熔断和降级等处理，保障系统的稳定性和可用性|

# Sentinel基本限流机制

开发步骤
- 定义资源
通过代码嵌入和注解集成
- 设置限流规则
指定流量统计类型和控制行为
- 验证限流效果
通过测试工具执行验证

## 定义资源
### 工具类
- SphU包含try-catch风格的API
```
try(Entry entry= SphU.entry("resourceName")){
    //被保护的业务逻辑
    // do something here...
}catch(BlockException ex){
    //资源访问阻止，被限流或被降级
    //在此处进行相应的处理操作
}
```
- SphO提供if-else风格的API
```
if(Spho.entry("resourceName")){
    //务必保证finally会被执行
    try {
        //被保护的业务逻辑
        // do something here...
    } finally {
            Spho.exit();
    }
} else{
    //资源访问阻止，被限流或被降级在此处进行相应的处理操作
}
```
### 注解
```
public @interface SentinelResource{ ... }
```
示例
```
public class TestService {
    //对应的 handleException`函数需要位于 ExceptionUtil类中并且必须为 static 函数
    @SentinelResource(value ="test", blockHandler = "handleException",blockHandlerClass = {ExceptionUtil.class})
    public void test(){
        System.out.println("Test");
    }

    @SentinelResource(value = "hello", blockHandler = "exceptionHandler", fallback = "hellofallback")
    public String hello(long s){
        return String.format("Hello at %d',s);
    }

    //Fallback函数，函数签名与原函数一致或加一个Throwable 类型的参数
    public String helloFallback(long s){
        return String.format("Hello fall back %d"S);
    }

    //Block异常处理函数，参数最后多一个其余与原函数一致BlockException
    public String exceptionHandler(long s, BlockException ex){
        ex.printStackTrace();
        return "Error occurred at" + s;
    }
}
```
## 限流规则
```
public class FlowRule extends AbstractRule {
    //限流阈值类型
    private int grade = RuleConstant.FLOW_GRADE_OPS;
    private double count;
    //基于调用关系的限流策略
    private int strategy = RuleConstant.STRATEGY_DIRECT;
    
    private String refResource;
    //流量控制效果
    private int controlBehavior = RuleConstant.CONTROL_BEHAVIOR_DEFAULT:
    //冷启动时长
    private int warmUpPeriodsec =10;
    private int maxQueueingTimeMs =500;
    private boolean clusterMode:
    private ClusterFlowConfig clusterConfig;
    //流量整形控制器
    private TrafficShapingController controller;
    ...
}
```
**Grade**
- FLOW_GRADE_THREAD
(资源的最大)并发线程数:相当于线程隔离机制
- FLOW_GRADE_QPS
每秒查询数QPS

**Strategy**
- STRATEGY_DIRECT
直接流控:当前资源访问量达到某个阈值时后续请求将被直接拦截
- STRATEGY_RELATE
关联流控:关联资源的访问量达到某个阈值时对当前资源进行限流
- STRATEGY_CHAIN
链路流控:指定链路的访问量大于某个阈值时对当前资源进行限流

**ControlBehavior**
|ControlBehavior|TrafficShapingController|效果||
|---|---|---|---|
|CONTROL_BEHAVIOR_DEFAULT|DefaultController|快速失败:直接拒绝超过阈值的请求||
|CONTROL_BEHAVIOR_WARM_UP|WarmUpController|冷启动限流:基于令牌桶算法并通过预热机制到达稳定的性能状态|Sentinel的冷启动限流确保系统在流量突增时平稳过渡，防止资源瞬间被打满。所谓冷启动，或预热是指，系统长时间处理低水平请求状态，大量请求突然到来时，并非所有请求都放行，而是慢慢增加请求，目的时防止大量请求冲垮应用，达到保护应用的目的。拿到令牌的会处理，放行一部分请求。预热可随时间增加令牌投放量。|
|CONTROL_BEHAVIOR_RATE_LIMITER|RateLimiterController|匀速限流:基于漏桶算法并结合虚拟队列等待机制|入队，慢慢处理|
|CONTROL_BEHAVIOR_WARM_UPRATE_LIMITER|WarmUpRateLimiterController|冷启动集成匀速限流||
## 设置限流规则
`FlowRuleManager`
```
private static void initFlowRules(){
    List<FlowRule> rules = new ArrayList<>();
    FlowRule rule = new FlowRule();
    // 资源名
    rule.setResource("myResource");
    //限流类型
    rule.setGrade(RuleConstant.FLOW GRADE OPS);
    //限流阈值
    rule.setCount(20);
    //限流策略
    rule.setStrategy(RuleConstant.STRATEGY CHAIN);
    //流量控制效果
    rule.setControlBehavior(RuleConstant,CONTROL_BEHAVIOR_DEFAULT);
    rule.setClusterMode(false)

    //添加FlowRule到执行流程中
    rules.add(rule);
    FlowRuleManager.loadRules(rules);
}
```

# Sentinel热点参数限流
参数限流是指根据方法调用传递的参数实现限流，或者根据接口的请求参数限流，而热点参数限流是指对访问频繁的参数进行限流，例如对频繁访问的IP地址进行限流等，热点参数限流会统计传入参数中的热点参数，并根据配置的限流值与模式，对包含热点参数的资源调用进行限流。
热点参数限流可以看做是一种特殊的流量控制，仅对包含热点参数的资源调用生效。
例如：
```
http://localhost:8080/test?a=10 访问100次
http://localhost:8080/test?b=10 访问10次
http://localhost:8080/test?c=10 访问3次
```
与围绕资源实现限流不同，热点参数限流是围绕资源的参数的不同取值来限流的，它不需要统计资源指标数据，而需要统计不同参数取值的指标数据。Sentinel利用LRU策略统计最近最常访问的热点参数结合令牌桶算法来进行参数级别的流控。

## 限流规则
|属性|说明|默认值|
|---|---|---|
|resource|资源名，非空||
|count|限流阈值，非空||
|grade|限流模式|QPS 模式|
|durationInSec|统计窗口时间长度(单位为秒)|1s|
|controlBehavior|流控效果|快速失败|
|paramldx|热点参数的索引，非空，对应 SphU.entry(xxx,args)方法中的参数索引位置||
|paramFlowltemList|参数例外项，可以针对指定的参数值单独设置限流阈值，不受前面count阈值的限制||
|clusterMode|是否是集群参数流控规则|false|
|clusterConfig|集群流控相关配置||

## 定义热点参数资源
**原生API方式**
```
@RestController
public class ParamController {
    final String resourceName ="test";
    
    @GetMapping("/param")
    public String test(@PathParam("id") String id, @PathParam("name") String name)Entry entry = null;
    try {
        //使用entry带参数的重载方法定义资源
        //id 处理不同的热点数据，最后一个参数是一个可变入参
        entry = Sphu.entry(resourceName,EntryType.IN,1,id);
        return"success";
    } catch(BlockException e){
        e.printStackTrace();
        return "block exception";
    } finally {
        if(entry != null){
            entry.exit();
        }
    }
}
```
**注解方式**
```
public static void initRule(){
    ParamFlowRule paramFlowRule = new ParamFlowRule();
    paramFlowRule.setResource("test");
    paramFlowRule.setGrade(RuleConstant.FLOW_GRADE_OPS);
    paramFlowRule.setCount(3):
    
    //允许的最大突发请求
    paramFlowRule.setBurstCount(10);
    paramFlowRule.setControlBehavior(RuleConstant.CONTROL _BEHAVIOR_DEFAULT);
    paramFlowRule.setDurationInSec(1);
    
    热点参数索引
    paramFlowRule.setParamIdx(0);
    
    List<ParamFlowRule> paramFlowRules = new ArrayList<>();
    paramFlowRules.add(paramFlowRule);
    //通过ParamFlowRuleManager加载规则
    ParamFlowRuleManager.loadRules(paramFlowRules);
}

@SentinelResource(value ="test')
@GetMapping("/hello")
public String test(@PathParam("id")Integer id){
    return "success";
}

```

# 集成
- 核心库
不依赖其他任何框架或者库，能够在任何ava环境上运行，并且能与Spring Cloud.Dubbo等开源框架进行整合
- 控制台
基于Spring Boot开发，独立可以运行Jar包，不需要额外的Tomcat等容器

## Spring Cloud Alibaba集成Sentinel
集成控制台
```
spring:
  cloud:
    sentinel:
      transport:
        dashboard:127.0.0.1:8088
```
集成Feign(链路流量控制)
```
feign:
  sentinel:
    enabled:true
```


# 思考题
如果想要实现对某一个微服务访问链路进行流量控制，开发上需要哪些主要步骤?
- 配置
- 代码
- 后台管理

