---
title: 4基于xxljob实现数据同步机制
description: 基于xxljob实现数据同步机制
date: 2024-09-12 16:02:10
tags:
---
理解定时任务调度机制
掌握Spring TaskScheduler的使用方法
掌握xxl-job的使用方法
任务调度解决哪些问题？

# 任务调度的概念

## 应用场景
![](4-任务调度应用场景.png)
## 任务调度的技术需求
![](4-任务调度技术需求.png)
- 系统是复杂的，集群化的
- 系统可能异常，如何应对错误
- 系统级别的管理手段，平台化统一管理控制调度任务而不是简单的一个脚本、配置

## 任务调度开源方案
- 单体
    - Quartz
    - Spring Task
- 分布式
    - Elastic-job
    - xxl-job
![](4-任务调度开源方案.png)


## 任务调度的基础-Java执行器模型
![](4-任务调度基础.png)

## spring任务调度器
![](4-任务调度基础-spring任务调度器.png)
注册BeanPostProcessor，它查找@Schedule注解的方法，启动ExecutorService，实现定时任务调度

## Cron表达式
![](4-任务调度基础-Cron.png) 

# xxl-job应用方法
轻量级分布式任务调度框架
通过中心式调度平台，调度多执行器执行任务
提供可视化监控界面
![](4-任务调度基础-xxljob.png)

## 数据模型
![](4-任务调度中心-数据模型-xxljob.png)

# 示例
## 启动xxl服务端
- 下载代码 https://github.com/xuxueli/xxl-job.git
- 执行脚本 /doc/db/tables_xxl_job.sql
- 修改xxl-job-admin配置文件
修改mysql地址，邮箱配置（password是授权码），token（客户端配置需与服务端一致）
- 生成xxl-job-admin.jar并启动
生成时需先install xxl-job-core 和xxl-job 到本地仓库
## 启动客户端
### 引入依赖
```
        <dependency>
            <groupId>com.xuxueli</groupId>
            <artifactId>xxl-job-core</artifactId>
            <version>2.3.1</version>
        </dependency>
```

### 配置
```
xxl:
  job:
    accessToken: default_token #与服务端配置一致
    admin:
      addresses: http://localhost:8082/xxl-job-admin
    executor:
      appname: demo1 # 客户端应用名称唯一，用于注册执行器
      logpath: E:/logs
      logretentiondays: 30
```
### 配置类
配置类，与服务端交互将执行器注册到服务端
```
@Configuration
@Slf4j
public class XxlJobConfig {

    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;

    @Value("${xxl.job.accessToken}")
    private String accessToken;

    @Value("${xxl.job.executor.appname}")
    private String appName;

    @Value("${xxl.job.executor.logpath}")
    private String logPath;

    @Value("${xxl.job.executor.logretentiondays}")
    private int logRetentionDays;


    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {
        log.info(">>>>>>>>>>> xxl-job config init.");
        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);
        xxlJobSpringExecutor.setAppname(appName);
        xxlJobSpringExecutor.setAccessToken(accessToken);
        xxlJobSpringExecutor.setLogPath(logPath);
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);

        return xxlJobSpringExecutor;
    }
}

```

### 具体执行器代码
```
@Component
public class DemoXxlJobHandler {
    private static Logger logger = LoggerFactory.getLogger(DemoXxlJobHandler.class);

    @XxlJob("demoJobHandler")
    public ReturnT<String> demoJobHandler(String param) throws Exception {
        logger.info(new Date() + "Test Xxl-Job1");

        return ReturnT.SUCCESS;
    }
    @XxlJob("demoJobHandler2")
    public ReturnT<String> demoJobHandler2(String param) throws Exception {
        logger.info(new Date() + "Test Xxl-Job2");

        return ReturnT.SUCCESS;
    }
}
```

## 配置服务平台
http://localhost:8082/xxl-job-admin
账号密码 admin/123456
![](4-配置服务平台.png)
![](4-配置服务平台2.png)
启动任务调度：任务管理页面，操作列


qq1755982343


