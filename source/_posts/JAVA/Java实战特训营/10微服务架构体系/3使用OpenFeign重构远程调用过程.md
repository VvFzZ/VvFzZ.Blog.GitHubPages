---
title: 3使用OpenFeign重构远程调用过程
description: 3使用OpenFeign重构远程调用过程
date: 2024-10-30 14:48:56
tags:
---


- OpenFeign开发模式
精细化控制远程调用
- OpenFeign高级特性

# OpenFeign开发模式
## 基本应用
Feign到OpenFeign

### OpenFeign开发模式
![](2-OpenFeign开发模式.png)

**@EnableFeignClients注解**
告诉系统扫描所有使用@FeignClient定义的Feign客户端
```
aSpringBootApplication(scanBasePackages = "org.geekbang.projects.cs.frontend.business.*")
@EnableFeignClients public class Application {
public static void main(String[] args){
    SpringApplication.run(Application.class,args);
}
```
**@FeignClient注解**
通过指定目标服务的名称或地址来发起远程调用
```
@ComponentaFeignClient(name ="ticket-service")
public interface Ticketclient {
    @RequestMapping(value ="/customerTickets/try",method = RequestMethod.Post)
    Result<Boolean> ticketTry(@RequestBody TccRequest<AddTicketRegVO> addTicketRegVO);
}
```

# OpenFeign高级特性
- 自动降级
- 超时配置
- 日志控制
- 错误解码


# 自动降级
```
@FeignClient(name = ApiConstants,SERVICE NAME, path = Apiconstants.PREFIX +"/decryptionAuditRecords", fallbackFactory = DecryptionAuditRecordApiFallback.class)public interface DecryptionAuditRecordApi {
    @RequestMapping(value="/",method = RequestMethod.POST)void addDecryptionAuditRecord(@RequestBody @Validated AddDecryptionAuditRecordRegaddDecryptionAuditRecordReg);
}

public class DecryptionAuditRecordApiFallback implements DecryptionAuditRecordApi {
    @Override
    public void addDecryptionAuditRecord(AddDecryptionAuditRecordReg addDecryptionAuditRecordReq) {}
}
```

# 超时配置
```
feign:
 client:
  config:
   default:# 全局超时配置
    connectTimeout:1000 # 网络连接阶段1秒超时
    readTimeout:5000 # 服务请求响应阶段5秒超时
   provider-service:# 针对特定服务的超时配置,优先级高于全局配置
    connectTimeout:1000
    readTimeout:2000
```

# 日志控制
```
@Configuration
@EnableFeignclients()
public class FeignConfiguration {
    @Bean
    Logger.Level feignLoggerlevel(){
        return Logger.Level.FULL;
    }
}

配置文件配置：
loggin:
 level:
  org:
   geekbang:
    projects:
     cs:DEBUG
```
**日志级别**
- NONE:不记录任何信息，这是OpenFeign默认的日志级别;
- BASIC:只记录服务请求的URL、HTTP Method、响应状态码(如 200、404等)和服务调用的执行时间:
- HEADERS:在BASIC的基础上，还记录了请求和响应中的HTTPHeaders;
- FULL:在HEADERS级别的基础上，还记录了服务请求和服务响应中的Body和metadata
FULL级别记录了最完整的调用信息。

# 错误解码
```
@Confiquration
@EnableFeianclients()
public class FeignConfiguration {
    @Bean
    FeignErrorDecoder errorDecoder()
    return new FeignErrorDecoder();
}
public class FeignErrorDecoder extends ErrorDecoder Default {
    private static final Logger logger = LoggerFactory.getLogger(FeignErrorDecoder.class);
    @Override
    public Exception decode(String methodKey, Response response){
        Exception exception =super.decode(methodKey, response);
        logger.error(exception.getMessage()，exception);return exception;
    }
}
```


# 思考题
1. 微服务为什么不用dobbu？
dubbo重在哪里？

2. OpenFeign在使用上与传统RestTemplate有什么区别？