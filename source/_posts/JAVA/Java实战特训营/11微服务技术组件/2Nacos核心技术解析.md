---
title: 2Nacos核心技术解析
description: 2Nacos核心技术解析
date: 2024-11-02 16:46:19
tags:
---
学习目标
- Nacos设计思想和亮点
- 作为注册中心和配置中心的核心技术组件


**分析框架的关注点**
- 设计思想
注册中心，配置中心的设计思想
- 基本流程
- 核心组件
- 通用机制


# 服务注册、发现、健康检查机制
- 注册中心
服务注册、发现、健康检查
- 配置中心
配置热更新

## 服务注册
### 客户端流程
![](2-Nacos服务注册-客户端流程.png)
**NamingService**

```
public class NacosNamingService implements NamingService{
    @Override
    public void registerInstance(String serviceName, String groupName, Instance instance) {
        //验证正确性、获取分组
        NamingUtils.checkInstanceIsLegal(instance);
        String groupedserviceName = NamingUtils.getGroupedName(serviceName, groupName);
        //如果是永久节点，则启动心跳
        if (instance.isEphemeral()){
            BeatInfo beatInfo = beatReactor,buildBeatInfo(groupedServiceName, instance);
            beatReactor,addBeatInfo(groupedServiceName,beatInfo);
        }

        //通过代理实现服务注册
        serverProxy,registerService(groupedServiceName,groupName, instance);

        @Override
        public void deregisterInstance(String serviceName, String groupName, Instance instance){
            if (instance.isEphemeral()){
                beatReactor,removeBeatInfo(NamingUtils.getGroupedName(serviceName, groupName),instance.getIp(),instance.getPort());
        }
        serverProxy,deregisterService(NamingUtils.getGroupedName(serviceName, groupName), instance);
        }
    }
}
```

**NameingProxy**
```
public class NamingProxy {
    private final NacosRestTemplate nacosRestTemplate =NamingHttpClientManager.getInstance().getNacosRestTemplate();

    public void registerService(String serviceName, String groupName, Instance instance){
        final Map<String, String> params = new HashMap<String, String>(16);params.put(CommonParams,NAMESPACE ID, namespaceId);
        ...
        params.put("metadata", JacksonUtils.toJson(instance.getMetadata()));    
        //封装请求，发起HTTP远程调用
        regApi(utilAndComs.nacosUrlInstance, params, HttpMethod.PosT);
    }
}
HttpRestResult<String> restResult = nacosRestTemplate,exchangeForm(url, header, Query.newInstance().initParams(params), body, method, string.class);
```

### 服务端流程
- 服务端存储
- 集群同步

![](2-Nacos服务注册-服务端流程.png)

`ServiceManager`
`ConsistencyService`
- PersistentConsistencyService
    - RaftConsistencyServicelmpl
- DelegateConsistencyServicelmpl 
- EphemeralConsistencyService
    - DistroConsistencyServicelmpl

**设计亮点**
- 服务存储
双层Map结构:注册中心主流存储方式
服务端缓存:提高服务实例获取性能
- 集群同步
集群同步机制:通过事件在各个集群之间异步传递变更实例信息，解耦也更利于扩展

## 服务发现
### 客户端流程
- 客户端缓存
- 定时同步
![](2-Nacos服务发现-客户端.png)

### 服务端流程
![](2-Nacos服务发现-服务端.png)
服务端会保存客户端列表，主动推送服务变更

### 设计亮点
- 客户端
客户端缓存:优先从本地缓存中获取服务信息`Map<String,Servicelnfo>servicelnfoMap`
定时任务:维护定时任务从服务端获取服务实例信息，并同步本地缓存服务订阅:具备服务订阅机制，可以获取来自服务端的异步推送
- 服务端
异步推送:开启一个UDP推送服务，将服务实例变更信息推送给客户端

## 健康检查
- 客户端上报
- 服务端探测

![](2-健康检查.png)
### Nacos健康检查
- 临时实例（临时结点）
临时存在于注册中心中，会与注册中心保持心跳，注册中心会在一段时间没有收到来自客户端的心跳后将实例设置为不健康，然后在一段时间后进行剔除
- 永久实例（永久节点）
会永久的存在于注册中心，且有可能并不知道注册中心存在，不会主动向注册中心上报心跳

#### 临时节点
Nacos客户端会维护一个定时任务，每隔5秒发送一次心跳请求
Nacos服务端在15秒内如果没有收到客户端的心跳请求，会将该实例设置为不健康
Nacos服务端在30秒内没有收到心跳，会将这个临时实例摘除
```
spring:
 cloud:
  nacos:
   discovery:
    server-addr:127.0.0.1:8848
    heart-beat-interval:5000
    heart-beat-timeout:15000
    ip-delete-timeout: 30000
```

客户端启动心跳任务
服务端定时检查，若状态异常推送异常状态(主动推送)
![](2-Nacos健康检查-临时结点.png)

#### 永久节点
采用服务端主动健康检测方式
周期为2000+5000毫秒内的随机数
*检测异常后只会标记为不健康，不会删除*

三种探测方式
- TCP探测
- MySQL探测
- HTTP探测





# 配置热更新机制
- 推模式
时效性好，但复杂度高
长连接，服务端和客户端消耗更多资源维持连接
- 拉模式
实现简单，但时效性差
重复请求服务器压力过大
- 长轮训
客户端发起HTTP请求（短连接），在服务端等待特定时间，若配置有变化立即返回，若无变化等待时间结束后返回，返回后立即重新发起连接。

**长轮训优点**
不会频繁轮训，也不需要维护心跳，兼顾时效与复杂度
- 低延时
客户端发起长轮询，服务端感知到数据发生变更后，能立刻返回响应给客户端
- 轻资源
客户端发起长轮询，如果数据没有发生变更服务端会hold住此次客户端的请求，不会消耗太多服务端资源

**客户端核心组件**
1. 初始化NacosConfigService
2. 初始化ClientWorker
3. 初始化线程池每10ms执行一次
4. 执行LongPollingRunnable
5. 长轮询获取变更的Datald+Group

NacosConfigService配置服务，封装客户端操作
ClientWorker客户端任务，启动和管理定时器线程
LongPollingRunnable长轮询线程，触发服务器轮询操作
HttpAgent执行HTTP远程调用，设置超时时间为30秒

没看懂ClientWorker、LongPollingRunnable

**服务端核心组件**
![](2-Nacos配置热更新-服务端.png)

ConfigController接收来自客户端的长轮询
LongPollingService根据目标Datald+Group，启动异步线程执行轮询操作
ClientLongPolling长轮询线程，维护请求和响应的对应关系
LocalDataChangeEvent配置变更事件，被LongPollingService监听和处理

## AsyncContext
```
public class simpleAsyncHelloservlet extends Httpservlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throwsServletException, IOException {
        //获取该请求对应的AsyncContext
        AsyncContext asyncContext = request.startAsync();
        asyncContext.start(()->{
            new LongRunningProcess().run();执行异步处理
            try {
                asyncContext.getResponse().getWriter().write("Hello world!");
            }catch(I0Exception e){
                e.printStackTrace();
            }
            asyncContext.complete();//执行完毕通知Servlet容器
        });            
    }
}
```
# 思考题
如果让你实现一个自定义的长轮询机制，你会怎么做?