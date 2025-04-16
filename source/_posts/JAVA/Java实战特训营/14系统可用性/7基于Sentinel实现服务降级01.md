---
title: 7基于Sentinel实现服务降级01
description: 7基于Sentinel实现服务降级01
date: 2024-11-29 17:16:54
tags:
---

学习目标
- 理解服务熔断器的类型和结构
- 掌握基于Sentinel的服务降级实现方法
- 理解Spring Clouud Circuit Breaker抽象过程

当系统资源出现瓶颈时，我们需要确保核心业务不受影响

目录
- 熔断器模型（基本结构）
- Sentinel降级机制（如何实现的，基本原理）
- Spring Cloud Circuit Breaker抽象

# 熔断器模型
Closed、Open、HalfOpen三态转换

## 自定义熔断器
```
//熔断器状态
public enum State{
    CLOSED,
    OPEN,
    HALFOPEN
}

//熔断器定义
public interface CircuitBreaker {
    //请求成功，重置熔断器
    void recordSuccess();
    //请求失败，处理结果并根据需要更新状态
    void recordFailure(String response);

    //获取熔断器当前状态
    String getState();
    //将熔断器设置到特定状态
    void setState(State state);

    // 对远程服务发起请求
    String attemptRequest() throws RemoteServiceException;
}

public class DefaultCircuitBreaker implements CircuitBreaker{
    //请求成功，设置熔断器状态
    @Override    
    public void recordSuccess(){
        this.failureCount = 0;
        this.lastFailureTime = System.nanoTime() + futureTime；
        this.state = State.CLOSED;
    }


    //请求失败，更新统计数据
    @Override
    public void recordFailure(String response){
        failureCount =failureCount +1;this,lastFailureTime =System.nanoTime();
        //保存失败响应，作为熔断器打开状态下的默认返回值
        this.lastFailureResponse=response;
    }

    public String attemptRequest()throws RemoteserviceException {
        //发起请求，评估熔断器状态
        evaluateState();
        if(state == State.OPEN){
            return this.lastFailureResponse;
        } else {
            try {
                String response =service.call();
                recordSuccess();
                return response;
            } catch(RemoteServiceException ex) {
                recordFailure(ex.getMessage());
                throw ex;
            }
        }
    }


    //根据失败次数、重试时间更新熔断器状态
    protected void evaluatestate(){
        if(failureCount >= failureThreshold){
            if((System.nanoTime()-lastFailureTime) > retryTimePeriod){
                state = State.HALF_OPEN;
            } else {
                state = State.OPEN;
            }
        } else {
            state = state.CLOSDE;
        }
    }
}
```

# Sentinel降级机制

## 开发步骤
- 定义资源
通过代码嵌入和注解集成
- 设置降级规则
指定熔断类型和控制行为
- 编写降级逻辑
实现回退函数
- 验证降级效果
通过测试工具执行验证

## 设置降级规则
```
public class DegradeRule extends AbstractRule {
    //熔断策略
    private int grade = RuleConstant.DEGRADE_GRADE_RT;
    private double count;
    //熔断时长，单位为s
    private int timeWindow;
    //熔断触发的最小请求数
    private int minRequestAmount = RuleConstant.DEGRADE DEFAULT MIN REQUEST AMOUNT;
    //慢调用比例阈值
    private double slowRatioThreshold = 1.0D;
    //统计时长
    private int statIntervalMs = 1000;
}
```

降级策略 按数量/比例
DEGRADE GRADE RT 按平均响应耗时熔断
DEGRADE GRADE EXCEPTION RATIO 按失败比率熔断
DEGRADE GRADE EXCEPTION COUNT 按失败次数熔断

配合降级策略使用
minRequestAmount 表示可触发熔断的最小请求数
slowRatioThreshold 表示超过限流阈值的慢请求数量

原生代码实现指定降级规则
```
在一分钟内，请求数超过2次，并且当异常数大于2之后请求会被熔断;
10s后断路器转换为半开状态，当再次请求又发生异常时会直接被熔断，之后重复。
private void initDegradeRule(){
    List<DegradeRule> rules = new ArrayList<>();
    DegradeRule degradeRule = new DegradeRule();
    //设置熔断降级资源名
    deqradeRule.setResource("resourceName");
    //设置降级规则:异常数
    degradeRule.setGrade(RuleConstant,DEGRADE_GRADE_EXCEPTION_COUNT);
    //阈值计数，这里是触发熔断异常数:2
    degradeRule.setCount(2);
    //可以触发熔断的最小请求数:2
    degradeRule.setMinRequestAmount(2);
    //统计时间间隔:1分钟
    degradeRule.setstatIntervalMs(60*1000);
    //熔断器打开时的恢复超时:10秒
    degradeRule.setTimeWindow(10);
    rules.add(degradeRule);DegradeRuleManager.loadRules(rules);
}
```
### 编码-注解
```
public class BuyFallback {
    // 回退方法
    public static String buyFallback(@PathVariable String name,@PathVariable Integer countThrowable throwable){...}
}
public class BuyBlockHandler {
    //异常处理
    public static String buyBlock(@PathVariable String name, @PathVariable Integer count.BlockException e){...}
}

@SentinelResource(value ="buy"fallback = "buyFallback"
    fallbackClass = BuyFallBack.class,
    blockHandler ="buyBlock",
    blockHandlerClass =BuyBlockHandler.class,
    exceptionsToIgnore =NullPointerException.class)
```
### CircuitBreaker
熔断器实现
```
public interface CircuitBreaker {
    DegradeRule getRule();
    boolean tryPass(Context context);
    CircuitBreaker,State currentState();
    void onRequestComplete(Context context);public static enum State {OPEN ,HALF OPEN,CLOSED;}
}
```

AbstractCircuitBreaker extends CircuitBreaker
ResponseTimeCircuitBreaker extends AbstractCircuitBreaker
ExceptionCircuitBreaker extends AbstractCircuitBreaker

# Spring Cloud Circuit Breaker抽象
Spring cloud Circuit Breaker内置熔断器
- Netflix Hystrix
- Resilience4J
- Sentinel
- Spring Retry

针对不同的熔断器，如何设计统一的API？




