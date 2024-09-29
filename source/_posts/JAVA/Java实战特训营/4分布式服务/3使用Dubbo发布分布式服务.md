---
title: 3使用Dubbo发布分布式服务
description: 3使用Dubbo发布分布式服务
date: 2024-09-19 21:21:00
tags:
---

# 引入Dubbo框架
定义：高性能透明化RPC架构实现方案，提供SOA服务治理方案
（实现了RPC基础功能组件，也实现了非功能性组件）

基本架构
![](1-Dubbo基础架构.png)

## Dubbo框架RPC架构演进过程
RPC架构演进过程：
一对一远程访问基础组件 -> 远程访问本地化组件 -> 集群访问和复杂均衡组件 -> 服务治理和监控组件

Dubbo框架演进过程：（基于RPC架构开发的分布式服务框架）
Protocol核心层，RPC基础组件 -> Proxy封装透明化代理 -> Cluster支持负载均衡和集群容错 -> Remoting实现Dubbo协议 -> Register完成服务治理、Monitor完成服务监控

## Dubbo中的RPC元素
协议 ： Dubbo  RMI  Hessian
传输 ： Netty Mina Grizzly
调用（动态代理） ： jdk javassist
序列化 ： Hessian Dubbo Json Java

## Dubbo开发方式
- XML
优点：服务框架对业务代码零侵入、扩展和修改方便、配置信息修改实时生效
缺点：配置繁琐，相对较重
- 注解
优点：服务框架对业务代码零侵入、扩展和修改方便
缺点:修改配置需要重新编译代码
- API
优点：底层api调用深入理解框架实现
缺点：对业务代码侵入性强、容易与某种具体服务框架绑定、修改之后需要重新编译代码
### XML
```
<dubbo:service/>：用于发布服务
<dubbo:reference/>：用于引用服务
<dubbo:protocol/> ：用于指定传输协议
<dubbo:application/> ：用于指定应用程序
<dubbo:registry/>：用于指定注册中心
```
### 注解
```
@EnableDubbo：启用Dubbo
@DubboService：服务发布
@DubboReference：服务引用
```
### API
```
DubboBootstrap：启动Dubbo
ServiceConfig：服务发布配置
ReferenceConfig：服务引用配置
```

# 服务发布机制

## 服务发布流程（RPC架构通用的发布流程）
发布启动器：获取服务列表和配置信息、将本地类封装成代理对象(具体怎么做的呢？)
动态代理：创建服务发布类？？？???(具体怎么做的呢？)
发布管理器：将服务发布成指定协议
协议服务器：创建协议服务器，启动监听（暴露端口给外部）
注册中心：
![](1-Dubbo-服务发布时序图.png)

##  Dubbo服务发布核心技术（特性功能）
### 上下文信息
RpcContext ThreadLocal的临时状态记录器(线程安全的)
存放当前调用过程中所需的环境信息上下文(请求地址、请求参数、响应时间等)
```
public class UserServiceImpl implements UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Override
    public User getUserByUserName(String userName) {
        logger.info("getUserByUserName: " + userName + ", request from consumer: " +RpcContext.getContext().getRemoteAddress());
        return new User(...);
    }
}
```

### 多版本
一个服务接口多个实现，通过版本号管理（例如分阶段服务接口升级，新老服务同时提供服务）
```
public class UserServiceImpl1 implements UserService {
    @Override
    public User getUserByUserName(String userName) {
         return new User(...);
    }
}
public class UserServiceImpl2 implements UserService {
    @Override
    public User getUserByUserName(String userName) {
         return new User(...);
    }
}

<!--发布版本1.0.0服务-->
<bean id="userService" class="com.dubbo.demo.provider.UserServiceImpl1"/>
<dubbo:service interface="com.dubbo.demo.UserService" ref="userService" version="1.0.0"/>

<!--发布版本2.0.0服务-->
<bean id="userService" class="com.dubbo.demo.provider.UserServiceImpl2"/>
<dubbo:service interface="com.dubbo.demo.UserService" ref="userService" version="2.0.0"/>

<!--分别引用版本1.0.0和版本2.0.0服务-->
<dubbo:reference id="userService" interface="com.dubbo.demo.UserService" version="1.0.0"/>
<dubbo:reference id="userService"interface="com.dubbo.demo.UserService" version="2.0.0"/>
```

### 隐式参数
传递新参数，但无法改变方法签名时
```
RpcContext.getContext().setAttachment("parameter", "tianyalan");

String value = RpcContext.getContext().getAttachment("parameter");
```

# 实例

## 定义Dubbo服务（没有实现）
领域对象：业务数据的抽象
服务定义：针对领域对象需暴露的操作
## 配置
```
dubbo:
  protocol:
    name: dubbo #dubbo协议
    port: -1
  registry: # 注册中心
    address: zookeeper://127.0.0.1:2181
    file: D:/dubbo/customer-service/cache
  scan:
    base-packages: org.geekbang.projects.cs #扫描dubbo服务
customer:
  service:
    version: 1.0.0
```
## 引入依赖
```
        <dependency>
            <groupId>org.apache.dubbo</groupId>
            <artifactId>dubbo-spring-boot-starter</artifactId>
        </dependency>

        <dependency>
            <groupId>org.apache.dubbo</groupId>
            <artifactId>dubbo-dependencies-zookeeper</artifactId>
            <type>pom</type>
            <exclusions>
                <exclusion>
                    <groupId>org.slf4j</groupId>
                    <artifactId>slf4j-log4j12</artifactId>
                </exclusion>
            </exclusions>
        </dependency>

        <!--替换curator默认版本，确保和Zookeeper服务器兼容-->
                <dependency>
            <groupId>org.apache.curator</groupId>
            <artifactId>curator-framework</artifactId>
            <version>4.2.0</version>
        </dependency>
```
## 服务约定

任何dubbo服务都需设计两个工程
definition 服务定义代码
provider 服务提供代码（服务实现）

## 注册dubbo服务
@DubboService(version = "${integration.service.version}")

```
@DubboService(version = "${integration.service.version}")
public class CustomerStaffIntegrationServiceImpl implements CustomerStaffIntegrationService {

    @Autowired
    CustomerStaffEndpoint customerStaffEndpoint;

    @Override
    public List<PlatformCustomerStaff> fetchCustomerStaffs(OutsourcingSystemDTO outsourcingSystemDTO) {

        return customerStaffEndpoint.fetchCustomerStaffs(outsourcingSystemDTO);
    }
}
```
# 问题
针对服务发布，Dubbo提供了哪些功能特性？
