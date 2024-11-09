---
title: 4使用ElasticSearch构建搜索服务
description: 4使用ElasticSearch构建搜索服务
date: 2024-10-11 09:50:32
tags:
---

学习目标
- 理解ES的搜索解决方案和能力
- 掌握ES各种搜索类型和使用方式

*Elastic search是目前业界最主流的分布式搜索引擎，没有之一*

目录
- Elastic Search 索引和文档的操作方式
es构建索引（lucene相对底层）
- 使用Elastic Search搜索


# Elastic Search索引和文档的操作方式


## 创建索引
### kibana
简单，可视化，开发调试方便
- 初始化setting
- 创建mapping

## 同步索引数据
- 基于Kibana同步索引数据
开发调试使用
- 基于Logstash同步索引数据
-般场景同步，定时任务执行脚本，控制力很弱（不好改）
- 基于客户端API同步索引数据
业务系统数据双写

### kibana

### Logstash
使用logstash-input-jdbc插件，同步支持jdbc规范的数据源（如mysql）
缺点：脚本可能需要处理业务逻辑，边界不清晰
- 控制输入
```
input {
    jdbc {
        # 数据库
        jdbc_connection_string =>"jdbc:mysql://localhost:3306/customer_system"
        # 用户名密码
        jdbc_user => "root"jdbc password => "root"
        # jar包的位置
        jdbc_driver_library =>"./mysql-connector-java-8.0.28.jar'
        #mysql的Driver
        jdbc_driver_class =>"com.mysql.jdbc.Driver"
        #读取这个
        sqlstatement_filepath =>"/mysql2es.sql"
        #每隔10分钟执行一次
        schedule =>*/10 * * * * 
        ...
    }
}
output {
    # index 索引名
    index => customer_auto_reply_index
    # 类似主键，es中id对应数据库的字段
    document_id =>"%{id}'
    stdout {
        codec => json lines
    }
}
```

> stdout打印输出

### Elastic Search客户端
- 原生es客户端
- 其他-Spring Data ES客户端
#### 原生es客户端
```
<dependency>
<groupId>org.elasticsearch.client</groupId><artifactId>elasticsearch-rest-high-level-client</artifactId>
</dependency>
```
配置信息
```
elasticsearch:
    info:
        username:elastic
        password: 123456
        hostname: localhost
        port:9200
        scheme: http
    index:
        customerAutoReplyIndex:customer auto reply_index
```
配置类
```
@RefreshScope
@configurationProperties(prefix="'elasticsearch.info"")
public class EsInfoconfig {
    private String username;
    private String password;
    private String hostname;
    private int port;
    private String scheme;
}
```
客户端类
```
public class EsClient {
    private final EsInfoconfig esInfoConfig;
    @Bean
    public RestHighLevelclient restHighLevelclient(){
        RestClientBuilder builder= RestClient.builder(new HttpHost(esInfoConfig.getHostname(),esInfoConfig.getPort()，esInfoconfig.getscheme()));
        CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
        credentialsProvider.setCredentials(AuthScope.ANY, newUsernamePasswordCredentials(esInfoConfig.getUsername(),esInfoConfig.getPassword()));
        builder,setHttpclientconfigcallback(f -> f.setDefaultCredentialsProvider(credentialsProvider));return new RestHighLevelclient(builder);
```
同步数据
```
//新增文档
IndexResponse response = client,index(request, RequestOptions.DEFAULT);
//批量新增文档
BulkResponse response = restHighLevelclient,.bulk(request, RequestOptions.DEFAULT);
//更新文档
UpdateResponse response = restHighLevelclient.update(request,RequestOptions.DEFAULT);
//根据查询删除文档
restHighLevelclient,deleteByQuery(request, RequestOptions.DEFAULT);
```

# 利用Elastic Search执行搜索

## 构建搜索对象
SearchRequest:搜索对象
    SearchSourceBuilder:搜索条件构建器
        BoolQueryBuilder:布尔查询构建器，组合多个查询
            QueryBuilders:查询构建器列表
            XXXBuilder:具体构建器
        HighlightBuilder:高亮构建器
        from/size:分页搜索支持

## 创建搜索条件
- Term(项)搜索:不执行分析(不分词)
termQuery单字段搜索
wildcardQuery通配符搜索
fuzzyQuery模糊搜索
prefixQuery字符串前缀搜索
- 全文搜索:执行分析（对字段进行分词处理，并依次匹配多个字段可以在重点字段上设置权重(boost)）
matchQuery单字段匹配搜索
multiMatchQuery多字段匹配搜索
matchPharseQuery词组匹配搜索

## 获取搜索结果
```
//1，发起搜素请求并获取结果
SearchResponse = esclient,search(searchRequest, EsConfig.COMMON_OPTIONS);
//2，获取匹配的数据
Searchifits hits = response.getHits();
//3，解析结果数据并包装成业务对象
for(SearchHit hit:hits){
    Map<String,0bject> result = hit.getSourceAsMap();
}
```
## 辅助搜索功能
```
SearchRequest searchRequest=..
SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
searchSourceBuilder.query(new TermQueryBuilder("city","Hangzhou"));
//指定返回的字段
searchSourceBuilder,fetchSource(new Stringil{"title","city"} , null);
searchRequest.source(searchSourceBuilder);
//结果计数
CountRequest countRequest = new CountRequest("notel");countRequest.source(searchSourceBuilder);
CountResponse countResponse = client.count(countRequest,RequestOptions.DEFAULT);
//结果分页
searchSourceBuilder.from(20)searchSourceBuilder.size(10);searchRequest.source(searchSourceBuilder);
```

### DSL
DSL(Domain Specific Language，领域特定语言)查询，是ES提出的基于JSON的搜索方式，在搜素时传入特定的JSON格式数据完成不同需求的搜索，通常可以和Kibana配合使用进行开发和调试。
```
//查询全部
{
    "query" :{"match_all":{}}
}

//分页查询全部
{
    "from" :
    "size":
    "query" :{"'match_all":{}}
}

//项查询
{
    "query":{
            "term":{
                "title”:“开发”
                }
            }
}


//全文多字段匹配查询
"query":{
    "multi match":{
        "query" : "Java"
        "fields" : ["title","content"],
        "minimum_should_match":"50%"
    }
}
```



# 示例
配置
```
# application.yaml
elasticsearch:
  info:
    username: elastic
    password: changeme
    hostname: localhost
    port: 9200
    scheme: http
  index:
    customerAutoReplyIndex: customer_auto_reply_index

# classes
@Data
@Component
@RefreshScope
@ConfigurationProperties(prefix = "elasticsearch.index")
public class EsIndexProerties {

    /**
     * 客服自动回复索引
     */
    private String customerAutoReplyIndex;
}

@Data
@Component
@RefreshScope
@ConfigurationProperties(prefix = "elasticsearch.info")
public class EsInfoConfig {

    private String username;

    private String password;

    private String hostname;

    private int port;

    private String scheme;

}
```
依赖
```
    <dependency>
		<groupId>org.elasticsearch.client</groupId>
			<artifactId>elasticsearch-rest-high-level-client</artifactId>
		</dependency>
		<dependency>
			<groupId>org.elasticsearch.client</groupId>
			<artifactId>elasticsearch-rest-client</artifactId>
		</dependency>
		<dependency>
			<groupId>org.elasticsearch</groupId>
			<artifactId>elasticsearch</artifactId>
		</dependency>
```
客户端
```
@Configuration
@RequiredArgsConstructor
public class EsClient {

    private final EsInfoConfig esInfoConfig;

    @Bean
    public RestHighLevelClient restHighLevelClient() {
        RestClientBuilder builder = RestClient.builder(new HttpHost(esInfoConfig.getHostname(), esInfoConfig.getPort(), esInfoConfig.getScheme()));
        CredentialsProvider credentialsProvider = new BasicCredentialsProvider();
        credentialsProvider.setCredentials(AuthScope.ANY, new UsernamePasswordCredentials(esInfoConfig.getUsername(), esInfoConfig.getPassword()));
        builder.setHttpClientConfigCallback(f -> f.setDefaultCredentialsProvider(credentialsProvider));

        return new RestHighLevelClient(builder);
    }
}

```

# 思考题
想搜索和全文搜索的区别？
