---
title: 5使用SpringCloudGateway实现API网关
description: 5使用SpringCloudGateway实现API网关
date: 2024-11-02 16:46:37
tags:
---

学习目标
- 网关的概念
- 网关的组成结构
- SpringCloudGateway的功能特性
- SpringCloudGateway使用方式

微服务架构中实现服务路由和转发的基础组件

目录
- 服务网关基本概念
- Spring Cloud Gateway功能特性
- Spring Cloud Gateway整合和扩展

# 服务网关基本概念

**服务网关结构和功能**
![](5-网关组成结构.png)

# Spring Cloud Gateway功能特性

**整体架构**
![](5-SpringCloudGateway整体架构.png)
Filter 过滤
Predicate 谓词（判断）
**技术体系**
Spring Cloud Gateway的核心功能是对Web请求进行路由和过滤其内部大量依赖于Spring中的响应式Web框架WebFlux
**执行流程**
![](5-执行流程.png)
DispatcherHander:分发请求
路由断言:判断路由逻辑
路由表:保存服务路由信息
过滤器链:执行过滤操作

**配置组件**
- Route(路由)
网关的基本构建块，由ID、目标URL、谓词集合和过滤器集合定义
- Predicates(谓词或断言)
匹配HTTP请求中的所有内容，例如消息头或参数。符合谓词规则才能通过
- Filter(过滤器)
对请求过程进行拦截，添加定制化处理机制

**配置路由**
```
spring:
 main:
  web-application-type:reactive # 以响应式方式运行Web应用，防止与MVC冲突
 cloud:
  gateway:
   discovery:
    locator:enabled: true #开启从注册中心动态创建路由的功能，利用服务名进行路由
    lower-case-service-id:true # 用小写的请求路径的服务名匹配服务，默认为false
   routes:
    - id: baiduroute
      uri: https://www.baidu.com
      predicates:
       - Path=/baidu/** # 前缀/baidu/的请求转发到baidu.com
    - id: chat-service
      uri: lb://chat-service # 指定URI ,负载均衡方式访问chat-service服务
      predicates:
       - Path=/chat/** # 指定谓词
      filters:
       - StripPrefix=1 # 去掉部分URL路径：第一段路由
       - PrefixPath=/chats #指定前缀
```

**查看路由**
添加actuator配置
查看路径：http://localhost:18080/actuator/gateway/routes

# Spring Cloud Gateway整合和扩展
GatewayFilter + GlobalFilter
GatewayFilter通过配置作用于每个路由，
GlobalFilter则作用于所有的请求当请求匹配到对应路由时
## 自定义GlobalFiler
```
@Configuration
public class JWTAuthFilter implements GlobalFilter {
  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    ServerHttpRequest.Builder builder = exchange.getRequest().mutate();
    builder.header("Authorization","JWTToken");
    chain.filter(exchange.mutate().request(builder.build()).build());
    return chain.filter(exchange.mutate().request(builder.build()).build());
  }
}
```
## 自定义GatewayFilter
```
public class PostGatewayFilterFactory extends AbstractGatewayFilterFactory {
  public PostGatewayFilterFactory() {
    super(Config.class);
  }
  public GatewayFilter apply() {
    return apply(o -> {
    });
  }
  @Override
  public GatewayFilter apply(Config config) {
    return (exchange, chain) -> {
      return chain.filter(exchange).then(Mono.fromRunnable(() -> {
        ServerHttpResponse response = exchange.getResponse();
        //添加针对Response的各种处理
      }));
    };
  }
  public static class Config { //读取路由配置信息
  }
}
```


## 内置过滤器
### 限流过滤器 
RequestRateLimiterGatewayFilter
```
spring:
 cloud:
  gateway:
   routes:
    - id: requestratelimiterroute
     uri: lb://testservice
     filters:
      - name: RequestRateLimiter
       args:
        redis-rate-limiter.replenishRate: 50 # 流量速度(每秒请求数)
        redis-rate-limiter.burstCapacity: 100 # 桶大小参数
```

## 扩展
- 异常处理
- 日志管理
- 灰度发布
- 安全控制
### 日志管理
```
@Component
public class AccessLogFilter implements GlobalFilter, Ordered {
  @Override
  public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
    ServerHttpRequest request = exchange.getRequest();
    String requestPath = request.getPath().pathWithinApplication().value();
    Route route = getGatewayRoute(exchange);
    String ipAddress = WebUtils.getServerHttpRequestIpAddress(request);
    GatewayLog gatewayLog = new GatewayLog();
    gatewayLog.setSchema(request.getURI().getScheme());
    gatewayLog.setRequestMethod(request.getMethodValue());
    gatewayLog.setRequestPath(requestPath);
    gatewayLog.setTargetServer(route.getId());
    gatewayLog.setRequestTime(new Date());
    gatewayLog.setIp(ipAddress);
    return writeBLog(exchange, chain, gatewayLog);
  }
}
```
### 灰度发布 
```
spring:
 cloud:
  gateway:
   routes:
    - id: old-customer-service
     uri: lb://old-customer-service
     predicates:
     - Path=/old/**
     #old-customer-service的流量权重
     - Weight=customer-group, 99
    - id: new-customer-service
     uri: lb://new-customer-service
     predicates:
     - Path=/new/**
     #new-customer-service流量权重
     - Weight=customer-group,1
```

Weight={group}, {weigth} //流量按组分流


# 思考题
如果想要基于Spring Cloud Gateway实现灰度发布，你有什么设计思路?


