---
title: Java实战特训营-2.7使用SpringBootAdmin监控服务运行
date: 2024-09-07 09:24:06
tags: 
description: 使用SpringBootAdmin监控服务运行
---
![](7.png)
JMX在Actuator之前使用
# 启用Actuator
引入依赖
```
     <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-hateoas</artifactId>
        </dependency>
```
配置
```
management:
  endpoints:
    web:
      exposure:
        include: "*" //展示所有端点
  endpoint:
    health:
      show-details: always //health展示详细信息
```
## 端点
![](7-端点的类型.png)

# 扩展和自定义Actuator端点
## info
info默认为空，需配置才显示数据
![](7-info端点.png)
info代表EnvironmentInfoContributor
app:自定义名字
encoding,java:根据展示值自定义
### 扩展info
```
@Component
public class CustomBuildInfoContributor implements InfoContributor {

    @Override
    public void contribute(Info.Builder builder) {
        builder.withDetail("build", Collections.singletonMap("buildBy", "tianyalan"));
    }
}

```
## health端点
![](7-health端点.png)
## 扩展health
```
@Component
public class CustomHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {

        try {
            URL url = new URL("http://XXX:8080/healthcheck/");
            HttpURLConnection connection = (HttpURLConnection)url.openConnection();
            int status = connection.getResponseCode();

            if(status >= 200 && status < 300) {
                return Health.up().build();
            } else {
                return Health.down().withDetail("Failed! code is: ", status).build();
            }
        } catch (Exception ex) {
            return Health.down(ex).build();
        }
    }
}

```
## 实现自定义端点
### 1
```
@Configuration
@Endpoint(id = "mysystem", enableByDefault = true)
public class MySystemEndpoint {

    @ReadOperation
    public Map<String, Object> getMySystemInfo() {
        Map<String, Object> result = new HashMap<>();
        Map<String, String> map = System.getenv();
        result.put("username", map.get("USERNAME"));
        result.put("computername", map.get("COMPUTERNAME"));
        return result;
    }
}

```

### 2带参数
```
@Configuration
@Endpoint(id = "customerStaff", enableByDefault = true)
public class CustomerStaffEndpoint {

    @Autowired
    private CustomerStaffMapper customerStaffMapper;

    @ReadOperation
    public Map<String, Object> getCustomerStaffByPhoneNumber(@Selector String arg0) {
        Map<String, Object> result = new HashMap<>();
        result.put(arg0, customerStaffMapper.findCustomerStaffByPhoneNumber(arg0));
        return result;
    }
}

```

# 构建Admin Server

## 架构
![](7-Admin.png)
## 基于独立服务的Admin Server
### 服务端
是一个springboot服务
![](7-Admin2.png)

- 引入依赖
![](7-AdminServer-Server配置.png)

- @EnableAdminServer注解

- 安全配置
![](7-AdminServer-Security配置.png)

暂时关闭认证：关闭默认Security的HTTP Basic认证
![](7-AdminServer-Security关闭验证.png)

### 客户端
- 依赖
spring-boot-admin-starter-client
- 配置
![](7-AdminServer-Client配置.png)

## 基于注册中心的Admin Server
![](7-Admin3.png)

# 自定义性能度量指标

## PerformanceMonitorInterceptor
### 日志配置
配置拦截器日志级别trace
```
logging:
  level:
    org.springframework.aop.interceptor: trace
```
### 示例
```

@Configuration
@EnableAspectJAutoProxy
@Aspect
public class CustomPerformanceMonitorInterceptor {
    @Pointcut(
            "execution(* com.vvf.springboot1.demos.web.BasicController.hello(..))"
    )
    public void  monitor() {

    }

    @Bean
    public PerformanceMonitorInterceptor performanceMonitorInterceptor() {
        return new PerformanceMonitorInterceptor();
    }

    @Bean
    public Advisor performanceMonitorAdvisor() {
        AspectJExpressionPointcut pointcut = new AspectJExpressionPointcut();
        pointcut.setExpression("com.vvf.springboot1.demos.performance.CustomPerformanceMonitorInterceptor.monitor()");
        return new DefaultPointcutAdvisor(pointcut, performanceMonitorInterceptor());
    }
}

//实现AbstractMonitoringInterceptor可自定义PerformanceMonitorInterceptor
```

## Micrometer库和组件
![](7-Micrometer.png)
![](7-Micrometer2.png)

### 代码示例
通用Counter
```

public class CustomCounter {

    private String name;
    private String tagName;
    private MeterRegistry registry;

    private Map<String, Counter> counters = new HashMap<>();

    public CustomCounter(String name, String tagName, MeterRegistry registry) {
        this.name = name;
        this.tagName = tagName;
        this.registry = registry;
    }

    public void increment(String tagValue) {
        Counter counter = counters.get(tagValue);
        if(counter == null) {
            counter = Counter.builder(name).tags(tagName, tagValue).register(registry);
            counters.put(tagValue, counter);
        }

        counter.increment();
    }

    public double getCount(String tagValue) {
        return counters.get(tagValue).count();
    }
}

```
具体业务实现
```

public class CustomerStaffCount {

    private static SimpleMeterRegistry registry = new SimpleMeterRegistry();

    private static CustomCounter customCounter = new CustomCounter("customerStaff", "phone", registry);

    public static void countPhoneNumber(String phoneNumber) {
        customCounter.increment(phoneNumber);
    }

    public static double getPhoneNumberCount(String phoneNumber) {
        return customCounter.getCount(phoneNumber);
    }

}
```

测试
```
public class CustomerStaffCounterTests {

    @Test
    public void testCountCustomerStaffPhoneNumber() {

        CustomerStaffCount.countPhoneNumber("13355667788");
        CustomerStaffCount.countPhoneNumber("13355667788");

        CustomerStaffCount.countPhoneNumber("13355667789");

        assertThat(CustomerStaffCount.getPhoneNumberCount("13355667788")).isEqualTo(2);
    }

}
```

# 其他
系统分析能力
基础能力
扩展能力
系统集成能力


框架应用
原理
实战

领导他人要有自己的方法论

