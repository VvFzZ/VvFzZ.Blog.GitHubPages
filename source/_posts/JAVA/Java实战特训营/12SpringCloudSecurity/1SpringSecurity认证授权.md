---
title: 1SpringSecurity认证授权
description: 1SpringSecurity认证授权
date: 2024-11-07 21:22:01
tags:
---

学习目标
- 常见安全性需求
- Spring security解决方案
- 基于Spring Security实现认证和授权的方法和实践

目录
- 安全性和Spring Security框架
- 用户认证及其实现方法
- 访问授权及其实现方法

# 安全性和Spring Security框架

用户认证(是谁)
权限控制(可以做啥)
单点登录
用户信息管理
跨域支持
敏感信息加解密
全局安全方法
跨站点请求伪造保护

Spring Security与单体应用：认证、授权

Spring Security与微服务架构：引入OAuth2协议、授权中心

  
# 用户认证实现方法
HTTP基础认证比较简单，没有定制的登录页面
```
public abstract class WebSecurityConfigurerAdapter implements WebSecurityConfigurer<WebSecurity> {
    protected void configure(HttpSecurity http) throws Exception {
        http.httpBasic();
    }
}
```
表单认证
```
public abstract class WebSecurityConfigurerAdapter implements WebSecurityConfigurer<WebSecurity> {
    protected void configure(HttpSecurity http) throws Exception {
        http.formLogin()
        //定制化登录界面和操作入口
        .loginPage("/login.html")//自定义登录页面
        .loginProcessingUrl("/action")//登录表单提交时的处理地址
        .defaultSuccessUrl("/index");//登录认证成功后的跳转页面
    }
}
```
## 认证体系
- 配置文件
- 内存
- JDBC
- LDAP
- 自定义

### 配置文件
```
spring:
 security:
  user:
   name: spring
   password: spring_password
```
### 内存
```
@Override
protected void configure(AuthenticationManagerBuilder builder) throws Exception {
    builder.inMemoryAuthentication()
    .withUser("spring_user").password("password1").authorities("ROLE_USER")
    .and()
    .withUser("spring_admin").password("password2").authorities("ROLE_USER","ROLE_ADMIN");
}
@Override
protected void configure(AuthenticationManagerBuilder builder) throws Exception {
    builder.inMemoryAuthentication()
    .withUser("spring_user").password("password1").roles("USER")
    .and()
    .withUser("spring_admin").password("password2").roles("USER","ADMIN");
}
```
### 数据库
```
@Autowired
DataSource dataSource;

@Override
protected void configure(AuthenticationManagerBuilder auth) throws Exception {
    auth.jdbcAuthentication().dataSource(dataSource)
    .usersByUsernameQuery("select username, password, enabled from Users where username=?")
    .authoritiesByUsernameQuery("select username, authority from UserAuthorities ""'where username=?")
    .passwordEncoder(new BCryptPasswordEncoder());
}
```
**PasswordEncoder**
没有解密
```
public interface PasswordEncoder {
    String encode(CharSequence rawPassword);
    boolean matches(CharSequence rawPassword, String encodedPassword);
    default boolean upgradeEncoding(String encodedPassword) {
        return false;
    }
}

public class BCryptPasswordEncoder implements PasswordEncoder {
    public String encode(CharSequence rawPassword) {
        String salt;
        if (random != null) {
            salt = BCrypt.gensalt(version.getVersion(), strength, random);
        } else {
            salt = BCrypt.gensalt(version.getVersion(), strength);
        }
        return BCrypt.hashpw(rawPassword.toString(), salt);
    }
}
```
自定义
```
public class Sha512PasswordEncoder implements PasswordEncoder {
    @Override
    public String encode(CharSequence rawPassword) {
        return hashWithSHA512(rawPassword.toString());
    }
    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        String hashedPassword = encode(rawPassword);
        return encodedPassword.equals(hashedPassword);
    }
    private String hashWithSHA512(String input) {
        StringBuilder result = new StringBuilder();
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte [] digested = md.digest(input.getBytes());
            for (int i = 0; i < digested.length; i++) {
                result.append(Integer.toHexString(0xFF & digested[i]));
            }
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Bad algorithm");
        }
        return result.toString();
    }
}
```

**加密通用模块**
提供解密
- 加解密器（Encryptor） 
- 键生成器（Key Generator）
```
String salt = KeyGenerators.string().generateKey();
String password = "secret";
String valueToEncrypt = "HELLO";
BytesEncryptor e = Encryptors.standard(password, salt);
byte [] encrypted = e.encrypt(valueToEncrypt.getBytes());
byte [] decrypted = e.decrypt(encrypted);
```

