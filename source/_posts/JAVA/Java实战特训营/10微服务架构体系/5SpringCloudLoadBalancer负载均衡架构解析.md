---
title: 5SpringCloudLoadBalancer负载均衡架构解析
description: 5SpringCloudLoadBalancer负载均衡架构解析
date: 2024-10-30 14:49:11
tags:
---

学习目标
- 客户端负载均衡的设计方法和策略
- Spring Cloud LoadBalancer的抽象和实现原理

负载均衡是一种基础设施类技术组件，往往和服务发现机制结合使用

目录
- LoadBalancerClient
- RestTemplate与负载均衡
- Feign与负载均衡


# LoadBalancerClient
![](5-SpringCloudLoadBalancer核心组件.png)
## LoadBalancerClient
`LoadBalancerClient`接口
`BlockingLoadBalancerClient`类的
choose获取负载均衡器实例，获取服务实例
execute执行请求

## ReactiveLoadBalancer
![](5-ReactiveLoadBalancer.png)
`RandomLoadBalancer` 框架实现的随机负载均衡器
`LoadBalancerClientFactory` 获取负载均衡器LoadBalancerClient
`LoadBalancerRequestFactory` 封装并发起请求

# RestTemplate与负载均衡
## @LoadBalanced核心类
![](5-@LoadBalanced核心类.png)

### `LoadBalanced`注解
```
//自动具备负载均衡机制
@LoadBalancedaBean
public RestTemplate getRestTemplate(){
    return new RestTemplate();
}
```

```
@Target({ ElementType,FIELD, ElementType,PARAMETER, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@Qualifier
public @interface LoadBalanced {}
```
### `LoadBalancerAutoConfiguration`

```
@confiquration(proxvBeanMethods = false)
@Conditional0nClass(RestTemplate.class)
@Conditional0nBean(LoadBalancerClient.class)@EnableConfigurationProperties(LoadBalancerClientsProperties.class)public class LoadBalancerAutoConfiguration {

    @LoadBalanced
    @Autowired(required = false)
    private List<RestTemplate> restTemplates = Collections.emptyList();
    @Autowired(required = false)
    private List<LoadBalancerRequestTransformer> transformers = Collections.emptyList()；
    @Bean
    @ConditionalOnMissingBean
    public LoadBalancerRequestfactory loadBalancerRequestfactory(LoadBalancerClient loadBalancerClient) {
        return new LoadBalancerRequestFactory(loadBalancerClient, this.transformers);
    }
}
```

#### `LoadBalancerInterceptorConfig`
```
@Configuration(
        proxyBeanMethods = false
    )
    @Conditional({RetryMissingOrDisabledCondition.class})
    static class LoadBalancerInterceptorConfig {
        LoadBalancerInterceptorConfig() {
        }

        @Bean
        public LoadBalancerInterceptor loadBalancerInterceptor(LoadBalancerClient loadBalancerClient, LoadBalancerRequestFactory requestFactory) {
            return new LoadBalancerInterceptor(loadBalancerClient, requestFactory);
        }

        @Bean
        @ConditionalOnMissingBean
        public RestTemplateCustomizer restTemplateCustomizer(final LoadBalancerInterceptor loadBalancerInterceptor) {
            return (restTemplate) -> {
                List<ClientHttpRequestInterceptor> list = new ArrayList(restTemplate.getInterceptors());
                list.add(loadBalancerInterceptor);
                restTemplate.setInterceptors(list);//添加拦截
            };
        }
    }
```
#### `loadBalancerInterceptor`
```
public class LoadBalancerInterceptor implements ClientHttpRequestInterceptor {
    private LoadBalancerClient loadBalancer;
    private LoadBalancerRequestFactory requestFactory;

    public LoadBalancerInterceptor(LoadBalancerClient loadBalancer, LoadBalancerRequestFactory requestFactory) {
        this.loadBalancer = loadBalancer;
        this.requestFactory = requestFactory;
    }

    public LoadBalancerInterceptor(LoadBalancerClient loadBalancer) {
        this(loadBalancer, new LoadBalancerRequestFactory(loadBalancer));
    }

    public ClientHttpResponse intercept(final HttpRequest request, final byte[] body, final ClientHttpRequestExecution execution) throws IOException {
        URI originalUri = request.getURI();
        String serviceName = originalUri.getHost();
        Assert.state(serviceName != null, "Request URI does not contain a valid hostname: " + originalUri);
        return (ClientHttpResponse)this.loadBalancer.execute(serviceName, this.requestFactory.createRequest(request, body, execution));
    }
}
```
`BlockingLoadBalancerClientAutoconfiguration`中注入`loadBalancer`

## 自定义负载均衡机制
- 定义@MyLoadBalanced注解
- 实现MyLoadBalancerAutoConfiguration配置类
- 实现MyLoadBalancerInterceptor
- 在RestTemplate上使用@MyLoadBalanced注解


**为什么在RestTemplate添加@Loadbalanced注解就能实现负载均衡?**
添加RestTemplate的拦截器，拦截器使用LoadBalancerClient实现负载均衡


# Feign与负载均衡
```
@ConditionalOnClass(Feign.class)
@ConditionalOnBean({ LoadBalancerctient,class, LoadBalancerclientFactory.class })
@AutoConfigureBefore(FeignAutoConfiguration.class)@AutoConfigureAfter({BlockingLoadBalancerclientAutoConfiguration.class,LoadBalancerAutoconfiquration.class})@EnableConfigurationProperties(FeignHttpclientProperties.class)
@Configuration(proxyBeanMethods =false)
@Import({ HttpClientFeignLoadBalancerConfiguration.class,OkHttpFeignLoadBalancerConfiguration.class，HttpClient5FeignLoadBalancerConfiguration.class,DefaultFeignLoadBalancerConfiguration.class})
public class FeignLoadBalancerAutoConfiguration{
}

```

## DefaultFeignLoadBalancerConfiguration
```
@Configuration(proxyBeanMethods =false)@EnableConfigurationProperties(LoadBalancerclientsProperties.class)class DefaultFeignLoadBalancerConfigurationf
aBeanaConditionalOnMissingBean@Conditional(0nRetryNotEnabledcondition.class)public client feignclient(LoadBalancerclient loadBalancerclientLoadBalancerClientFactory loadBalancerclientFactory){return new FeignBlockingLoadBalancerclient(new client,Default(null, null), loadBalancerclient,
loadBalancerClientFactory);
```

# 思考题
**这几个注解的用法**？
@ConditionOnClass(RestTemplate.class)
@ConditionOnBean(LoadBalancerClient.class)
@EnableConfigurationProperties(LoadBalancerClientsProperties.class)

@AutoConfiqureAfter(LoadBalancerAutoConfiquration.class)
BlockingLoadBalancerClientAutoconfiguration

**ClientHttpRequestInterceptor**
**Hint机制**
