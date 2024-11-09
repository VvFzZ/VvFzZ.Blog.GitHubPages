---
title: 4使用SpringCloudLoadBalancer重构服务在均衡
description: 4使用SpringCloudLoadBalancer重构服务在均衡
date: 2024-10-30 14:49:04
tags:
---
学习目标
- 客户端负载均衡机制和算法
- SpringCloud LoadBalancer基本用法
- 定制化路由策略的实现机制和方法

服务路由定制化策略是实现服务灰度发布等基础能力的基础

目录
- Spring Cloud LoadBalancer用法
- 定制化路由策略

# Spring Cloud LoadBalancer用法
有哪些服务？如何选择其中一个？谁来分发？（服务端、客户端）
## 获取服务列表
`DiscoveryClient`
```
@Autowired
RestTemplate restTemplate;

@Autowired
private DiscoveryClient discoveryClient;

public User getUserByUserName(String userName){
    List<ServiceInstance> instances = discoveryClient.getInstances("userservice");

    if(instances.size()==0) return null;

    String userserviceUri = String,format("%s/users/%s",instances.get(0).getUri().toString()，userName);
    ResponseEntity<User> user =restTemplate.exchange(userserviceUri, HttpMethod.GET, null, User.class, userName);
    return result.getBody();
}
```

## 负载均衡类型
- 客户端负载均衡
- 服务端负载均衡

**异同点**
位置不同
服务端有性能，可用性瓶颈
客户端简单,灵活（客户端自己控制负载），流量小，客户端复杂（需要获取所有服务器及其状态），微服务一般使用（不希望再加一层负载层）
![](4-负载均衡类型.png)
## 负载均衡算法
### 静态算法
**随机 Random**
- 普通随机
- 加权随机
**轮训 Round Robin**
- 普通轮训
- 加权轮询
**源IP哈希 Source IP Hash**'

**一致性哈希 Consistent Hash**

### 动态算法
**最少链接算法**

**服务调用时延算法**

## `@LoadBalancer`注解

```
//配置负载均衡机制
@LoadBalanced
@Bean
public RestTemplate getRestTemplate(){
    return new RestTemplate();
}

//使用restTemplate时自动负载
ResponseEntity<UserMapper>restExchange = restTemplate.exchange("http://userservice/users/{userName}",HttpMethod.GET,null,UserMapper.class,userName);
```
# 定制化路由策略

## ReactiveLoadBalancer接口
![](4-ReactiveLoadBalancer接口类层结构.png)

**指定负载均衡器**
```
@Configuration
public class MyLoadBalancerConfig {
    @Bean
    public ReactorServiceInstanceLoadBalancer reactorServiceInstanceLoadBalancer(Environment environment, LoadBalancerClientFactory loadBalancerclientFactory){
        String name = environment.getProperty(LoadBalancerclientFactOry.PROPERTY NAME);
        //返回随机轮询负载均衡方式
        return new RandomLoadBalancer(loadBalancerClientfactory.getLazyProvider(name,ServiceInstanceListsupplier.class)，name);
}
```

## 定制化负载均衡策略
1. 实现ReactorServiceInstanceLoadBalancer接口
2. 初始化自定义MyLoadBalancerConfig配置
3. 通过@LoadBalancerClient注解指定自定义配置
###  实现ReactorServiceInstanceLoadBalancer接口
```
public class CustomRandomLoadBalancerClient implements ReactorServiceInstanceLoadBalancer {

    // 服务列表
    private ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider;

    public CustomRandomLoadBalancerClient(ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider) {
        this.serviceInstanceListSupplierProvider = serviceInstanceListSupplierProvider;
    }

    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        ServiceInstanceListSupplier supplier = serviceInstanceListSupplierProvider.getIfAvailable(NoopServiceInstanceListSupplier::new);
        return supplier.get().next().map(this::getInstanceResponse);
    }

    /**
     * 使用随机数获取服务
     *
     * @param instances
     * @return
     */
    private Response<ServiceInstance> getInstanceResponse(List<ServiceInstance> instances) {
        System.out.println("进入自定义负载均衡算法");
        if (instances.isEmpty()) {
            return new EmptyResponse();
        }

        System.out.println("执行自定义随机选取服务操作");
        // 随机算法
        int size = instances.size();
        Random random = new Random();
        ServiceInstance instance = instances.get(random.nextInt(size));

        return new DefaultResponse(instance);
    }
}
```
###  初始化自定义LoadBalancerConfig配置
```
@Configuration
public class CustomLoadBalancerConfig {

    @Bean
    public ReactorServiceInstanceLoadBalancer customLoadBalancer(ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider) {
        return new CustomRandomLoadBalancerClient(serviceInstanceListSupplierProvider);
    }
}
```
###  通过@LoadBalancerClient注解指定自定义配置
```
@SpringBootApplication(scanBasePackages = {"org.geekbang.projects.cs"})
@MapperScan("org.geekbang.projects.cs.middleground.customer.mapper")
@LoadBalancerClient(name = "integration-service", configuration = CustomLoadBalancerConfig.class)
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## OpenFeign处理机制
**通过RequestTemplate定制化请求处理机制**
```
public class MyFeignRequestInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate requestTemplate){
        //Feign请求过程中，对于传输数据的各种定制化处理机制扩展
        ...
    }
}

```



# 基于标签定制化路由机制
```
package org.geekbang.projects.cs.middleground.customer.loadbalancer;

import cn.hutool.core.collection.CollUtil;
import com.alibaba.cloud.nacos.balancer.NacosBalancer;
import org.geekbang.projects.cs.infrastructure.tag.TagUtils;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.loadbalancer.DefaultResponse;
import org.springframework.cloud.client.loadbalancer.EmptyResponse;
import org.springframework.cloud.client.loadbalancer.Request;
import org.springframework.cloud.client.loadbalancer.Response;
import org.springframework.cloud.loadbalancer.core.NoopServiceInstanceListSupplier;
import org.springframework.cloud.loadbalancer.core.ReactorServiceInstanceLoadBalancer;
import org.springframework.cloud.loadbalancer.core.ServiceInstanceListSupplier;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class TagLoadBalancerClient implements ReactorServiceInstanceLoadBalancer {

    @Value("${tag}")
    private String tagValue;

    // 服务列表
    private ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider;

    public TagLoadBalancerClient(ObjectProvider<ServiceInstanceListSupplier> serviceInstanceListSupplierProvider) {
        this.serviceInstanceListSupplierProvider = serviceInstanceListSupplierProvider;
    }

    @Override
    public Mono<Response<ServiceInstance>> choose(Request request) {
        ServiceInstanceListSupplier supplier = serviceInstanceListSupplierProvider.getIfAvailable(NoopServiceInstanceListSupplier::new);

        //TODO：先利用写死的Tag进行测试，需要结合网关进行重构
        return supplier.get().next().map(list -> getInstanceResponse(list, tagValue));
    }

    private Response<ServiceInstance> getInstanceResponse(
            List<ServiceInstance> instances, String tagValue) {
        if (instances.isEmpty()) {
            return new EmptyResponse();
        }

        List<ServiceInstance> chooseInstances = filterList(instances, instance -> tagValue.equals(TagUtils.getTag(instance)));
        if (CollUtil.isEmpty(chooseInstances)) {
            System.out.println("没有满足tag:" + tagValue + "的服务实例列表，直接使用所有服务实例列表");
            chooseInstances = instances;
        }

//        // 随机算法
//        int size = instances.size();
//        Random random = new Random();
//        ServiceInstance instance = instances.get(random.nextInt(size));
//        return new DefaultResponse(instance);

        //直接使用Nacos提供的随机+权重算法获取实例列表
        return new DefaultResponse(NacosBalancer.getHostByRandomWeight3(chooseInstances));
    }

    public static <T> List<T> filterList(Collection<T> from, Predicate<T> predicate) {
        if (CollUtil.isEmpty(from)) {
            return new ArrayList<>();
        }

        return from.stream().filter(predicate).collect(Collectors.toList());
    }
}
```

设置服务tag:在nacos服务列表可编辑服务元数据
