---
title: 2实现跨服务HTTP请求和响应
description: 实现跨服务HTTP请求和响应
date: 2024-09-12 16:01:21
tags:
---

# RestTemplate使用方法
## 请求过程
![](2-RestTemplate-请求过程.png)

### 创建RestTemplate
![](2-RestTemplate-创建对象.png)

#### 方法介绍
![](2-RestTemplate-方法.png)

#### 指定消息转换器
![](2-RestTemplate-指定消息转换器.png)

#### 设置拦截器
![](2-RestTemplate-设置拦截器.png)

#### 异常处理
![](2-RestTemplate-异常处理.png)
## 示例
```
//注入RestTemplate
    @Bean
    public RestTemplate restTemplate() {
        //注入RestTemplate
        return new RestTemplate();
    }
    
@Component
public class OutsourcingSystemClient {

    @Autowired
    RestTemplate restTemplate;

    public List<CustomerStaff> getCustomerStaffs(OutsourcingSystem outsourcingSystem) {

        //通过RestTemplate发起远程调用
        ResponseEntity<Result> result = restTemplate.exchange(
                outsourcingSystem.getSystemUrl(),
                HttpMethod.GET,
                null,
                Result.class
        );

        List<CustomerStaff> customerStaffs = (List<CustomerStaff>)result.getBody().getData();

        return customerStaffs;
    }
}
```
# WebClient使用方法

## 创建对象
![](2-WebClient-创建对象.png)

## 设置url和请求参数
![](2-WebClient-url和请求参数.png) 

## 访问服务

### url参数
exchange方法返回结果包含响应码等信息
![](2-WebClient-执行访问.png)

### 请求体参数
普通参数对象使用syncbody方法
响应式流对象Mono对象使用body方法
![](2-WebClient-执行访问2.png)

## 拦截请求
![](2-WebClient-请求拦截.png)
管道过滤器模式

## 异常处理
![](2-WebClient-异常处理.png)
