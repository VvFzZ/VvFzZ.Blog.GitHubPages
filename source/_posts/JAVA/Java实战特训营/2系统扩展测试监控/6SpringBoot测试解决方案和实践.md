---
title: Java实战特训营-2.6SpringBoot测试解决方案和实践
date: 2024-09-07 09:23:09
tags:
description: SpringBoot测试解决方案和实践
---

# 测试的类型和实施策略
![](6-测试分类.png)
单元测试：类级别
集成测试：组件级别，模块间、服务间
端到端测试：服务级别，业务流程开展的测试，覆盖多服务（关注服务之间数据和状态传递）



# Spring Boot测试方案和流程

## 依赖
![](6-SpringBoot测试依赖.png)

## 测试流程

### @SpringBootTest
![](6-@SpringBootTest.png)

### @ExtendWith
![](6-@ExtendWith.png)
如果只想启用Spring环境进行简单测试，不想启用Spring Boot环境，可以配置扩展为：SpringExtension。

### 执行测试用例
![](6-执行测试用例.png)

# 数据访问层测试
## @MybatisPlusTest注解
基于mybatis-plus框架，只验证数据访问层能力，不启动容器和controller层。
没有使用@SpringBootTest注解，不验证spring容器能力
前提：
- mybatis-plus-boot-starter-test
- 在Test/resource/application.yaml中配置配置数据源

```
@ExtendWith(SpringExtension.class)
@MybatisPlusTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) //使用配置的数据源（Test/resource/application.yaml中配置）
public class CustomerStaffTests {

    @Autowired
    private CustomerStaffMapper customerStaffMapper;

    @Test
    public void testQueryCustomerStaffById() {
        CustomerStaff customerStaff = customerStaffMapper.selectById(1L);

        assertNotNull(customerStaff);
        assertNotNull(customerStaff.getNickname().equals("tianyalan"));
    }
}
```

## @DataJpaTest注解
```
@ExtendWith(SpringExtension.class)
@DataJpaTest
@AutoConfigureTestDatabase //自动配置内存数据库，需配置内存数据库依赖(如h2)
public class CustomerStaffRepositoryTests {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private HangzhouCustomerStaffRepository customerStaffRepository;

    @Test
    public void testCustomerStaffCreationAndQuery() {
        HangzhouCustomerStaff customerStaff = new HangzhouCustomerStaff();
        customerStaff.setIsDeleted(false);
        customerStaff.setCreatedAt(new Date());
        customerStaff.setUpdatedAt(new Date());
        customerStaff.setNickname("tianyalan");
        customerStaff.setGender("MALE");

        this.entityManager.persist(customerStaff);

        List<HangzhouCustomerStaff> result = customerStaffRepository.findByIsDeletedFalse();

        assertThat(result).isNotNull();
        assertThat(result.size()).isEqualTo(1);
    }
}
```


# 业务逻辑层测试

## 测试配置
![](6-测试配置.png)
## 测试Service层
- @MockBean
- Mockito框架

```
import org.geekbang.projects.cs.entity.staff.CustomerStaff;
import org.geekbang.projects.cs.mapper.CustomerStaffMapper;
import org.geekbang.projects.cs.service.ICustomerStaffService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
public class CustomerStaffServiceTests {

    @MockBean
    private CustomerStaffMapper customerStaffMapper;

    @Autowired
    private ICustomerStaffService customerStaffService;

    @Test
    public void testFindCustomerStaffById() {

        Long staffId = 1L;

        CustomerStaff customerStaff = new CustomerStaff();
        customerStaff.setId(staffId);
        customerStaff.setNickname("tianyalan");
        customerStaff.setIsDeleted(false);

        //模拟返回一个假想的customerStaff
        Mockito.when(customerStaffMapper.selectById(staffId)).thenReturn(customerStaff);

        CustomerStaff actual = customerStaffService.findCustomerStaffById(staffId);

        assertThat(actual).isNotNull();
        assertThat(actual.getId()).isEqualTo(staffId);
    }

}

```


也可mock其他Service层

# 测试Web API层
- TestRestTemplate
- @WebMvcTest注解
- @AutoConfigureMockMvc

```

import org.geekbang.projects.cs.entity.staff.CustomerStaff;
import org.geekbang.projects.cs.service.ICustomerStaffService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
public class CustomerStaffControllerTestsWithAutoConfigureMockMvc {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ICustomerStaffService customerStaffService;

    @Test
    public void testFindCustomerStaffById() throws Exception {

        Long staffId = 1L;

        CustomerStaff customerStaff = new CustomerStaff();
        customerStaff.setId(staffId);
        customerStaff.setNickname("tianyalan");
        customerStaff.setIsDeleted(false);

        given(customerStaffService.findCustomerStaffById(staffId)).willReturn(customerStaff);

        mvc.perform(get("/customerStaffs/" + staffId).accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

    }
}

```