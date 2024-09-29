---
title: 6Mybatis和Spring集成原理剖析
date: 2024-09-05 10:23:48
tags:
description: Mybatis和Spring集成原理剖析
---
![](6.png)
# Spring启动扩展点
Spring如何做到与Dubbo，Mybatis等无缝集成？
![](6-框架集成效果.png)

## 集成Spring框架
- 扩展点
![](6-扩展点.png)

### InitializingBean

![](6-InitializingBean.png)
![](6-InitializingBean2.png)
```
public class User implements InitializingBean, BeanNameAware {

    private String name;

    private Integer age;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }


    @PostConstruct
    public void postC() {
        System.out.println("user PostConstruct");
    }

    public User() {
        System.out.println("user ctor");
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        System.out.println("user initializingBean afterPropertiesSet");
    }


    public void init() {
        System.out.println("user init");
    }


    @Override
    public void setBeanName(String name) {
        System.out.println("set BeanName:" + name);
    }
}

@Configuration
public class BeanConfig {

    @Bean(initMethod = "init")
    public User user() {
        return new User();
    }
}

```
输出结果：
user ctor
set BeanName:user
user PostConstruct
user initializingBean afterPropertiesSet
user init


### Aware
- ApplicatinoContextAware
- BeanNameAware
- ApplicationEventPublisherAware
![](6-Aware.png)
![](6-Aware1.png)

### FactoryBean

- 复杂对象创建
- 对象以来Spring生命周期某个时间点（和生命周期其他扩展接口一起使用）
![](6-FactoryBean.png)

### ApplicationListener
![](6-ApplicationListener.png)

Spring框架事件处理核心类
![](6-ApplicationListener-Spring框架事件处理核心类.png)


# MyBatis-Spring集成过程
## SqlSessionFactoryBean类结构

![](6-SqlSessionFactoryBean.png)

![](6-SqlSessionFactoryBean2.png)

## MapperFactoryBean
![](6-MapperFactoryBean.png)
## SqlSessionDaoSupport 

![](6-MapperFactoryBean-SqlSessionDaoSupport.png)

# SqlSessionTemplate线程安全

线程不安全导致的问题？
SqlSession包含一个独立数据库连接Connection对象线程不安全，多线程共享SqlSession可能导致数据混乱，事务冲突。SqlSession还包含一级缓存，多线程共享可能导致数据不一致（A线程插入数据中途，B线程查询结果并缓存）。

Mybatis 的 SqlSession线程不安全，Spring集成如何保证安全？
SqlSessionDaoSupport类 构建了一个SqlSession 的代理对象。SqlSessionDaoSupport类 包含SqlSessionTemplate对象，SqlSessionTemplate对象包含SqlSession的代理对象，创建代理对象时将其放在ThreadLocal中，保证线程安全。

## SqlSessionTemplate的定位

![](6-SqlSessionTemplate的定位.png)
## SqlSessionTemplate初始化
![](6-SqlSessionTemplate初始化.png)
## 动态代理
![](6-SqlSessionTemplate动态代理.png) 
## SqlSessionHolder
![](6-SqlSessionTemplate-SqlSessionHolder.png)
## TransactionSynchronizationManager
![](6-SqlSessionTemplate-TransactionSynchronizationManager.png) 




Spring 事件有哪些，如何扩展？