---
title: 5基于MyBatis实现数据访问
date: 2024-09-05 10:22:57
tags: 
description: 基于MyBatis实现数据访问
---
![](5.png)
# Mybatis整体架构和核心组件
## ORM执行流程
![](5-ORM框架执行SQL流程.png)
外观层：不需要关注复杂的事务实现原理，只是拿来用
映射层：生成sql语句（sql语句转换成statement，参数赋值到sql语句）
## MyBatis整体架构
![](5-Mybatis整体架构.png)

## MyBatis核心对象
![](5-Mybatis核心对象.png)
### 核心对象的生命周期
![](5-Mybatis核心对象-声明周期.png)

# MyBatis和Spring整合方式
原生MyBatis过于底层，一般和Spring结合起来使用，类似SrpingJDBC封装JDBC。Mybatis-Spring封装了SqlSessionFactory、SqlSession、mapper底层处理过程。
## Mybatis和Spring（MyBatis-Spring框架）
### 启动
![](5-Mybatis和Spring-启动.png)
### SqlSession
SqlSession Template、SqlSession DaoSupport
![](5-Mybatis和Spring-SqlSession.png)
### Mapper
![](5-Mybatis和Spring-Mapper.png)
## Mybatis和SpringBoot（Spring Boot MyBatis框架）
进一步封装，完整的Spring自动配置体系，简单的定义注解+Mapper接口+方法+sql语句即可实现。
从重配置的代码实现转换成重代码实现（重：重量级）
![](5-Mybatis和SpringBoot.png)

### 代码

#### 引入依赖
```
<dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>2.2.2</version>
        </dependency>
```
#### 定义mapper接口

```
@Mapper
public interface MybatisCustomerStaffMapper {

    @Select("select * from customer_staff where id=#{starffId}")
    public CustomerStaff findCustomerById(Long staffId);

    @Insert("insert into customer_staff()(group_id,nickname,account_id)" +
            "values(#{groupId},#{nickname},#{accountId})")
    @Options(useGeneratedKeys = true,keyProperty = "id")
    void createCustomerStaff(CustomerStaff customerStaff);
}

```

#### 配置扫描mapper
```
@MapperScan("org.geekbang.projects.cs.mapper")
public class Application {}
```
注意Mybatis配置扫描类没有*号（spring配置常用\*）


# Spring Boot配置体系
约定优于配置的思想贯彻者
## 配置文件
![](5-SpringBoot配置体系-配置文件.png)
## Profile
![](5-SpringBoot配置体系-Profile.png)

# 问题
相比原生MyBatis ，MyBatis-Spring和Spring Boot MyBatis分别作了哪些封装？
原生MyBatis 提供DataSource、SqlSessionFactory、SqlSession、Mapper等基础组件
- MyBatis-Spring 封装了重复使用MyBatis基础组件操作数据的过程，通过配置简化编码。

- Spring Boot MyBatis 基于Spring Boot自动化配置将配置文件简化，从重配置过渡到重编码实现