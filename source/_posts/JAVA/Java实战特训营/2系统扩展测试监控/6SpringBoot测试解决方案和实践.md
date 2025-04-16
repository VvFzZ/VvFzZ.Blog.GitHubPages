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
```
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-test</artifactId>
     <scope>test</scope>
     <exclusions>
         <exclusion>
             <groupId>org.junit.vintage</groupId>
             <artifactId>junit-vintage-engine</artifactId>
         </exclusion>
     </exclusions>
 </dependency>
 <dependency>
     <groupId>org.junit.platform</groupId>
     <artifactId>junit-platform-launcher</artifactId>
     <scope>test</scope>
 </dependency>
```
<!-- ![](6-SpringBoot测试依赖.png) -->

## 测试流程

### @SpringBootTest
```
@SpringBootTest(classes = UserApplication.class, webEnvironment =SpringBootTest.WebEnvironment.MOCK)
```
- MOCK
加载WebApplicationContext并提供一个Mock的Servlet环境，内置的Servlet容器并没有真实的启动
- RANDOM PORT
加载EmbeddedWebApplicationContext并提供一个真实的Servlet环境，也就是说会启动内置容器，然后使用的是随机端口
- DEFINED PORT
加载EmbeddedWebApplicationContext并提供一个真实的Servlet环境，但使用配置的端口(默认8080)
- NONE
加载ApplicationContext但并不提供任何真实的Servlet环境
<!-- ![](6-@SpringBootTest.png) -->

#### 排除aop引入原生bean
##### @SpringBootTest并排除AOP
```
@SpringBootTest(properties = {
    "spring.aop.auto=false"  // 禁用AOP自动配置
})
```
##### @Import直接导入Controller类
```
@WebMvcTest
@Import(MyController.class)  // 直接导入Controller类，不经过代理
public class MyControllerTest {
    @Autowired
    private MyController myController;
    
    // 测试方法...
}
```
##### new创建实例并手动注入依赖
若依赖其他bean需手动mock
```
public class MyControllerTest {
    private MyController myController;
    
    @BeforeEach
    public void setup() {
        // 手动创建实例并注入依赖
        myController = new MyController();
        // 手动注入依赖（如果有）
        // myController.setSomeService(mockSomeService);
    }
    
    // 测试方法...
}
```
##### @TestConfiguration提供非代理Bean
```
@SpringBootTest
public class MyControllerTest {
    @TestConfiguration
    static class TestConfig {
        @Bean
        @Primary
        public MyController myController() {
            return new MyController();  // 返回原始对象
        }
    }
    
    @Autowired
    private MyController myController;
    
    // 测试方法...
}
```
##### 针对特定测试禁用AOP
```
@SpringBootTest
public class MyControllerTest {
    @Autowired
    private ApplicationContext context;
    
    private MyController myController;
    
    @BeforeEach
    public void setup() {
        // 获取原始对象而非代理
        myController = context.getBean(MyController.class);
        if(AopUtils.isAopProxy(myController)) {
            myController = (MyController) ((Advised) myController).getTargetSource().getTarget();
        }
    }
    
    // 测试方法...
}
```

### @ExtendWith
@ExtendWith(SpringExtension)
连接 JUnit 5 和 Spring 测试框架,单独使用测试非springboot应用
不支持自动装配，手动加载配置文件，不启动servlet服务器
<!-- ![](6-@ExtendWith.png) -->
@SpringBootTest内置@ExtendWith

### 执行测试用例
3A原则
Arrange:测试用例执行之前需要准备测试数据
Act:通过不同的参数来调用接口，并拿到返回结果
Assert:执行断言，判断执行结果是否符合预期
```
@ExtendWith(SpringExtension.class)
public class UserTests {
    private static final String USER NAME = "tianyalan";
    @Test
    public void testUsernameIsMoreThan5Chars()throws Exception {
        //ArrangeUser user = new User("001", USER NAME, 39, new Date(),"china");
        //Act + Assert
        assertThat(user.getName()).isEqualTO(USER NAME);
    }
}
```
<!-- ![](6-执行测试用例.png) -->

# 数据访问层测试
## @MybatisPlusTest注解
基于mybatis-plus框架，只验证数据访问层能力，不启动容器和controller层。
没有使用@SpringBootTest注解，不验证spring容器能力
前提：
- mybatis-plus-boot-starter-test
- 在Test/resource/application.yaml中配置配置测试数据源
不依赖项目真实数据源，隔离真实数据源

- Replace.AUTO_CONFIGURED (默认)自动用嵌入式DB替换
- Replace.NONE 不替换，使用配置的真实DB
Test/resource/application.yaml中配置数据源时使用此配置数据源
- Replace.ANY
替换所有数据源（包括嵌入式）

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
和SpringbootTest注解冲突，不可同时使用
- @AutoConfigureMockMvc



```
//WebMvcTest注解
@ExtendWith(SpringExtension.class)
@WebMvcTest(UserController.class)
public class UserControllerTestsWithMockMvc {
    @Autowired
    private MockMvc mvc
    @MockBean
    private UserService userService;
    
    @Test
    public void testGetUserById()throws Exception {
        String userId ="001";
        User user = new User(userId, "tianyalan", 38, new Date(), "china");
        given(this.userService,findUserById(userId)).willReturn(user);
        this.mvc.perform(get("/users/" + userId).accept(MediaType.APPLICATION JSON)).andExpect(status().isOk());
    }
}

//SpringBootTest + AutoConfigureMockMvc
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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