---
title: Java实战特训营-2.1使用Mybatis-Plus对数据访问进行扩展
date: 2024-09-07 09:18:13
tags:
description: 使用Mybatis-Plus对数据访问进行扩展
---
# MyBatis-Plus开发模式
## 为什么开发MyBatis-Plus
MyBatis的缺点
- 自动化程度不高，需要写SQL语句操作业务数据
- 对字段名称的识别校验不友好，易出错不好排查
- 通过XML配置映射字段和属性，影响开发效率
MyBatis-Plus的特点
- 不使用SQL，少量代码即可实现CRUD
- 支持Lambda，字段强校验
- 内置代码生成器，自动生成各层框架代码
- 内置分页，性能分析，全局拦截插件
## MyBtisPlus-ActiveRecord模式
一般不使用，而是分层model和mapper，service分开
![](1-MyBatisPlus-ActiveRecord模式.png)

## MyBatisPlus-整体架构
![](1-MyBatisPlus-整体架构.png)

## 查询
![](1-MyBatisPlus-查询.png)

## Id生成策略
![](1-MyBatisPlus-Id生成策略.png)
## 分页
![](1-MyBatisPlus-分页.png)

## 逻辑删除
![](1-MyBatisPlus-逻辑删除.png)
# 客服系统案例演进
## 升级策略
由Mybatis 升级成Mybatis-Plus相关改造点
![](1-MyBatisPlus-升级策略.png)

### 依赖
```
 <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>mybatis-plus-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>com.baomidou</groupId>
            <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
        </dependency>
```

### 配置
```

spring:
  application:
    name: customer-service
  jackson:
    date-format: yyyy-MM-dd HH:mm:ss
    time-zone: Asia/Shanghai
  datasource:
    dynamic:
      primary: master
      druid:
        initial-size: 3
        min-idle: 3
        max-active: 40
        max-wait: 60000
      datasource:
        master:
          driver-class-name: com.mysql.cj.jdbc.Driver
          url: jdbc:mysql://127.0.0.1:3306/customer_system?characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
          username: root
          password: root
mybatis-plus:
  mapper-locations: classpath:mapperXml/*.xml
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      # 逻辑删除字段名
      logic-delete-field: is_deleted
      # 逻辑删除字面值：未删除为0
      logic-not-delete-value: 0
      # 逻辑删除字面值：删除为1
      logic-delete-value: 1

```
### model 
```
@TableName("customer_staff")
public class CustomerStaff implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;


    private String name;

        /**
     * 是否删除，1=删除,0=未删除
     */
    @TableLogic
    private Boolean isDeleted;
}
```
### mapper
```
public interface CustomerStaffMapper extends BaseMapper<CustomerStaff> {

    default CustomerStaff findCustomerStaffByPhoneNumber(String phoneNumber) {

        LambdaQueryWrapper<CustomerStaff> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CustomerStaff::getPhone, phoneNumber);
        queryWrapper.eq(CustomerStaff::getIsDeleted, false);

        return selectOne(queryWrapper);
    }



}
```

### service
```
public class CustomerStaffServiceImpl extends ServiceImpl<CustomerStaffMapper, CustomerStaff> implements ICustomerStaffService {
    public List<CustomerStaff> findCustomerStaffs() {
        LambdaQueryWrapper<CustomerStaff> queryWrapper = new LambdaQueryWrapper<>();
        return baseMapper.selectList(queryWrapper);
    }
  public PageObject<CustomerStaff> findCustomerStaffs(Long pageSize, Long pageIndex) {

        return getCustomerStaffPageObject(null, pageSize, pageIndex);
    }
    
    private PageObject<CustomerStaff> getCustomerStaffPageObject(String staffName, Long pageSize, Long pageIndex) {
        LambdaQueryWrapper<CustomerStaff> queryWrapper = new LambdaQueryWrapper<>();
//        queryWrapper.eq(CustomerStaff::getIsDeleted, false);

        if(!Objects.isNull(staffName)) {
            queryWrapper.like(CustomerStaff::getStaffName, staffName);
        }
        queryWrapper.orderByDesc(CustomerStaff::getCreateTime);

        IPage<CustomerStaff> page = new Page<>(pageIndex, pageSize);
        IPage<CustomerStaff> pagedResult = baseMapper.selectPage(page, queryWrapper);

        PageObject<CustomerStaff> pagedObject = new PageObject<CustomerStaff>();
        pagedObject.buildPage(pagedResult.getRecords(), pagedResult.getTotal(), pagedResult.getCurrent(), pagedResult.getSize());

        return pagedObject;
    }
    @Override
    public Boolean deleteCustomerStaffById(Long staffId) {

        //通过更新操作实现逻辑删除
//        CustomerStaff customerStaff = new CustomerStaff();
//        customerStaff.setId(staffId);
//        customerStaff.setIsDeleted(true);
//
//        return updateById(customerStaff);

        //通过逻辑删除为来进行逻辑删除
        return this.removeById(staffId);
    }
}
```
### 分页配置类
```
@Configuration
public class MybatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(){
        //1 创建MybatisPlusInterceptor拦截器对象
        MybatisPlusInterceptor mpInterceptor=new MybatisPlusInterceptor();
        //2 添加分页拦截器
        mpInterceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        return mpInterceptor;
    }
}

```
# MyBatis-Plus SQL执行流程
## MyBatisMapper获取流程
![](1-MyBatisMapper获取流程.png)
代码流程
![](1-MyBatisMapper代码流程.png)
最终通过创建了一个代理类MapperProxy,
代理对象MapperProxy内部创建MapperMethod实例通过SqlSession进一步完成sql执行操作
![](1-MyBatisMapper代理模式.png)

### MapperMethod
内部使用SqlSession
#### SqlSession获取过程
![](1-SqlSession获取流程.png)

##### SqlSession执行流程
![](1-SqlSession执行流程.png)
- MappedStatement sql语句封装对象
- Executor 执行器
    - BaseExecutor 一级缓存
    - CachingExecutor 二级缓存

Executor继承关系图
> https://docs.qq.com/flowchart/DRUhkS1V6YmVZb1ZZ

二级缓存建议关闭。
```
mybatis:
  configuration:
    cache-enabled: false
    local-cache-scope: session
```
使用二级缓存的异常场景：两个线程都有自己的二级、一级缓存，线程1更新操作并清空二级缓存，此时线程2可能查找到一级缓存的脏数据。

读源码时的疑问
BaseExecutor为什么先put一个枚举值，再执行查询，再删除k/v，再缓存查询结果呢？如下代码
```
  private <E> List<E> queryFromDatabase(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql) throws SQLException {
    List<E> list;
    localCache.putObject(key, EXECUTION_PLACEHOLDER);
    try {
      list = doQuery(ms, parameter, rowBounds, resultHandler, boundSql);
    } finally {
      localCache.removeObject(key);
    }
    localCache.putObject(key, list);
    if (ms.getStatementType() == StatementType.CALLABLE) {
      localOutputParameterCache.putObject(key, parameter);
    }
    return list;
  }
```

## 执行流程总结
![](1-MyBatis执行流程总结.png)
处理流程总结：
- SqlSessionFactoryBean用来生成SqlSessionFactory
- MapperFactoryBean初始化时会生成一个线程安全的SqlSession对象。
  - MapperFactoryBean继承自SqlSessionDaoSupport,SqlSessionDaoSupport包含SqlSessionTemplate对象，SqlSessionTemplate包含一个SqlSessionProxy对象SqlSessionProxy创建时会保存到ThreadLocal中以保证线程安全。
  - SqlSessionTemplate(SqlSession)初始化代理对象时，调用openSessionFromDataSource方法，初始化excutor，开启事务，返回SqlSession对象
- SqlSession.getMapper()时获取到的是mapper代理对象
  - configuration.getMapper(SqlSession);
- MapperProxy包含一个MapperMethod类，用来执行sql语句。
- MapperMethod内部通过SqlSession执行SQL语句。
- SqlSession通过Executor对象执行
- Executor分为BaseExcutor和CachingExcutor
- Executor内部使用 StatementHandler、ResultHandler执行sql语句，处理结果



# 问题

- 为什么Mapper层的接口没有实现类却能完成SQL执行等一系列操作？JDK代理模式，MapperProxyFactory创建代理类MapperProxy，MapperProxy代理MapperMethod类，MapperMethod类通过SqlSession等参数构建执行sql

- MyBatisPlus在Mybatis基础上添加了哪些增强功能？

