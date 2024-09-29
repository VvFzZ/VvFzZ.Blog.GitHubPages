---
title: 1.1SpringBoot开发WebAPI
date: 2024-09-05 10:27:43
tags:
description: SpringBoot开发WebAPI
---

# 使用Spring Boot开发Web API

## Maven功能特性和最佳实践

> https://docs.qq.com/mind/DRU5LdHZlU01SZkZr?subId=BB08J2&mode=mind

### Maven的作用
- 自动化构建工具    
    - 完整的构建生命周期
    - 标准化构建过程
- 其他
    - 依赖管理
    - 仓库（中央仓库）

### 坐标与依赖

<img src="1.1-maven-坐标与依赖.png">

### 依赖管理
<img src="1.1-maven-依赖管理.png">

### 最佳实践
#### 建立专用的依赖管理工程
该工程中只有一个pom文件

![](1.1-maven-最佳实践1.png)

#### 灵活使用属性变量
<img src="1.1-maven-最佳实践2.png">

#### 多环境配置
<img src="1.1-maven-最佳实践3.png">

## 代码工程1.0
<img src="1.1-代码-工程结构.png">

### 约定
<img src="1.1-代码-约定.png">

## 开发
### Lombok
```
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@NoArgsConstructor
@AllArgsConstructor
public class MyTest {
    String name;
    String addr;
}
```
### AOP+日志框架
slf4j MDC
<img src="1.1-代码-日志.png">

### Controller技术组件
```
@RestController
@RequestMapping("/customerStaffs")
public class CustomerStaffController {
    @PostMapping("/")
    public Result<Long> addCustomerStaff(@RequestBody AddCustomerStaffReqVO addCustomerStaffReqVO) {...}

    @GetMapping("/{staffId}")
    public Result<CustomerStaffRespVO> findCustomerStaffById(@PathVariable("staffId") Long staffId) {...}
}
```
### mapstruct
```
@Mapper
public interface CustomerStaffConverter {

    CustomerStaffConverter INSTANCE = Mappers.getMapper(CustomerStaffConverter.class);

    //VO->Entity
    CustomerStaff convertCreateReq(AddCustomerStaffReqVO addCustomerStaffReqVO);
    CustomerStaff convertUpdateReq(UpdateCustomerStaffReqVO updateCustomerStaffReqVO);

    //Entity->VO
    CustomerStaffRespVO convertResp(CustomerStaff entity);
    List<CustomerStaffRespVO> convertListResp(List<CustomerStaff> entities);
}
```
## 问题
- 多级代码工程中，如何有效管理对第三方组件的依赖关系？
建立独立的依赖工程，利用maven提供的手段依赖排除、归类、范围进行管理
