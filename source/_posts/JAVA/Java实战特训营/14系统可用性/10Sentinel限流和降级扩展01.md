---
title: 10Sentinel限流和降级扩展01
description: 10Sentinel限流和降级扩展01
date: 2024-11-29 17:17:13
tags:
---

学习目标
- 理解Sentinel内置扩展性组件和原理
- 掌握Sentinel对于限流和降级的扩展性实现方法


目录
- Sentinel扩展点分析
- Sentinel实现动态规则
- Sentinel实现定制化降级策略

# Sentinel扩展点分析

JDK SPI机制实现过程
- 设计一个服务接口并提供对应的实现类，可以根据扩展需求提供多种实现类
- 在META-INF/services目录中创建一个以服务接口命名的文件，配置实现该服务接口的具体实现类
- 外部程序通过META-INF/services/目录下的配置文件找到具体的实现类名并实例化

## Sentinel扩展点
|扩展点名称|扩展点描述|
|---|---|
|InitFunc|用来实现系统初始化|
|SlotChainBuilder|用于基于自定义SlotchainBuilder的实现来构造Slotchain|
|ReadableDataSource|用来实现规则持久化|
|CommandHandler|用于实现网络通信|

### InitFunc
```
public class FlowRuleInitFunc implements InitFunc{
    @Override
    public void init()throws Exception {
        List<FlowRule> rules=new ArrayList<>();FlowRule rule=new FlowRule();
        rule.setResource("doTest");
        rule.setGrade(RuleConstant.FLOW GRADE QPS);
        rule.setCount(5);
        rules.add(rule);
        FlowRuleManager.loadRules(rules);
    }
}
```
在META-INF/services/com.alibaba.csp.sentinel.init.InitFunc文件中，添加自定义扩展点的全路径

### SlotChainBuilder
自定义Slot链
```
public class MySlotChainBuilder implements SlotchainBuilder {
    @Override
    public ProcessorSlotchain build(){
        ProcessorSlotChain chain=DefaultSlotChainBuilder;chain.addLast(new NodeSelectorSlot());
        chain.addLast(newClusterBuilderslot());
        chain.addLast(new FlowSlot());
        chain.addLast(newDegradeSlot());
        return chain;
    }
}
```
在META-INF/services/com.alibaba.csp.sentinel.slotchain.SlotChainBuildel文件中，添加自定义扩展点的全路径

# Sentinel实现动态规则
## 规则管理
- API代码创建
缺乏动态灵活性
- Dashboard配置
无法持久化
- DataSource
适配不同数据源的修改


**Zookeeper动态数据源管理实现**

# Sentinel实现定制化降级策略
实现降级开关

## 实现
- 定义和加载开关降级规则类 SwitchRule
- 实现开关判断处理机制 SwitchSlot
- 集成开关逻辑 SwitchChecker
- 实现SPI扩展点 SlotChainBuilder 

### SwitchRule
```
public class SwitchRule {
    public static final String SWITCH_KEY_OPEN = "open";
    public static final String SWITCH_KEY_CLOSE = "close";
    //开关状态
    private String status = SWITCH_KEY_OPEN;
    //开关控制的资源
    private Resources resources;
    @Data
    @ToString
    public static class Resources {
        //包含的资源 一条规则对应多个资源
        private Set<String> include;
        //排除的资源
        private Set<String> exclude;
    }
}
```
 
### SwitchRuleChecker
开关判断处理机制
1. 如果资源不配置
开关不作用到任何资源 
2. 如果配置include 
作用到include指定的所有资源
3. 如果不配置include且配置了exclude
除exclude指定的资源外，其它资源都受这个开关的控制

```
Set<SwitchRule> switchRuleSet = initSwitchRule();
// 遍历规则
for (SwitchRule rule : switchRuleSet) {
    // 判断开关状态，开关未打开则跳过
    if (!rule.getStatus().equalsIgnoreCase(SwitchRule.SWITCH_KEY_OPEN)) {
        continue;
    }
    if (rule.getResources() == null) {
        continue;
    }
    // 实现 include 语意
    if (!CollectionUtils.isEmpty(rule.getResources().getInclude())) {
        if (rule.getResources().getInclude().contains(resource.getName())) {
            throw new SwitchException(resource.getName(),"switch");
        }
    }
    // 实现 exclude 语意
    if (!CollectionUtils.isEmpty(rule.getResources().getExclude())) {
        if (!rule.getResources().getExclude().contains(resource.getName())) {
            throw new SwitchException(resource.getName(),"switch");
        }
    }
}
```


### SwitchSlot

```
public class SwitghSlot extends AbstractLinkedProcessorSlot<Object>{
    @Override
    public void entry(Context context, Resourcelrapper resourcelrapper, Object o, int i, boolean b, 0bject... objects) throws Throwabl{
        //在调用资源时执行开发降级的判断
        SwitchRuleChecker.checkSwitch(resourceWrapper, context)
        fireEntry(context,resourceWrapper, o,i,b, objects)
    }

    @Override
    public void exit (Context context, Resourcerapper resourceWrapper, int i, 0bject... objects){
        fireExit(context, resourceWrapper, i, objects)
    }
}
```
### SlotChainBuilder
```
public class SwitchSlotChainBuilder extends DefaultSlotChainBuilder{
    
    @Override
    public ProcessorSlotChain build(){
        ProcessorSlotChain chain = super.build():
        chain.addLast(new SwitchSlot());
        return chain;
    }
}
```

在META-INF.services目录中新建文件com.alibaba.csp.sentinel.slotd.chain.SlotchainBuilder
内容：实现类全路径

# 思考题
如果让你实现一个定制化的限流降级Slot，你需要设计并开发哪些核心组件?
