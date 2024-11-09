---
title: 5ShardingSphere分片引擎执行流程解析
description: 5ShardingSphere分片引擎执行流程解析
date: 2024-10-07 15:05:31
tags:
---

学习目标
- 掌握数据分片的执行流程
分几步，每步的输入输出
- 掌握ShardingSphere中各个数据分片引擎的基本结构和原理

目录
- SQL解析、路由、改写引擎
- SQL执行和归并引擎

# 分片引擎
解析引擎 SQLParserEngine 
路由引擎 ShardingSQLRouter 
改写引擎 SQLRewriteEngine 
执行引擎 ExecutorEngine 
归并引擎 MergeEngine 

# SQL解析、路由、改写引擎
内核工具类将三个引擎串联起来

## 解析引擎
SQL语句转换为抽象语法树AST

三步骤
生成SQL抽象语法树 输出AST
提取SQL片段 输出SQLSegment
填充SQL语句 输出SQLStatement

### AST
![](5-ShardingSphere-解析引擎-AST.png)

## 路由引擎
6个核心步骤
1. 对SQLStatement中的分片信息做合理性进行验证
2. 获取SQLStatementContext
3. 如果是InsertStatement则自动生成主键
如果是雪花算法等组件则初始化组件
4. 创建分片条件ShardingConditions
5. 获取SQLRouteExecutor并执行路由
根据分片条件路由
6. 构建路由上下文RouteContext

### 路由引擎-核心组件交互
![](5-ShardingSphere-路由引擎-核心组件交互.png)
分层设计：
- infrastructure 基础设施层，为core层提供基础能力
- core 核心层提供应用层使用 
#### 入口SQLRouteEngine
```
public final class sQLRouteEngine {
    private final Collection<ShardingSphereRule> rules;
    private final ConfigurationProperties props;
    public RouteContext route(final LogicsQL logicsQL, final ShardingSphereDatabase database) {
        //通过SQLRouteExecutor具体执行路由
        SQLRouteExecutor executor =isNeedAllSchemas(logicsQL.getSqlStatementContext().getSqlStatement())? new AllSQLRouteExecutor():new PartialSQLRouteExecutor(rules, props);
        return executor.route(logicsQL, database);
}

    private boolean isNeedAllSchemas(final SQLStatement sqlStatement) {
        return sqlStatement instanceof MySQLShowTablesStatement || sglStatement instanceof MysQLShowTableStatusStatement;
    }
}
```

### 分片策略
分片策略=分片算法+分片键
![](5-ShardingSphere-路由引擎-分片策略.png)

#### ShardingStrategy类
```
public interface ShardingStrategy {
    //获取分片列
    Collection<String>getShardingColumns()
    //获取分片算法
    ShardingAlgorithm getShardingAlgorithm();
    //执行分片
    Collection<String>doSharding(Collection<String> availableTargetNames,Collection<ShardingConditionValue>shardingConditionValues,DataNodeInfo dataNodelnfo, ConfigurationProperties props);
}

public interface ShardingSphereAlgorithm extends TypedSPl, SPlPostProcessor {
    Properties getProps();
}

public interface ShardingAlgorithm extends ShardingSphereAlgorithm {
}
```

#### 标准分片策略-StandardShardingstrategy
精确分片 PreciseShardingValue 提供对SQL语句中 (= IN)操作的分片支持
范围分片 RangeShardingValue 提供对SQL语句中 (>=，<=，BETWEEN,AND)等操作的分片支持
```
public Collection<String> doSharding(final Collection<String> availableTargetNames, finalCollection<ShardingConditionValue> shardingConditionValues, finalDataNodelnfo dataNodelnfo, finalConfigurationProperties props){
    ShardingConditionValue shardingConditionValue = shardingConditionValues.iterator().next();
    //如果分片值是一个列表，则执行Precisesharding;如果分片值是一个范围，则执行Rangesharding
    Collection<String> shardingResult = shardingConditionValue instanceof ListShardingConditionValue    
        ? dosharding(availableTargetNames, (listShardingConditionValue) 
        : dosharding(availableTargetNames, (RangeShardingconditionValue) shardingConditionValue, dataNodelnfo);
    Collection<String> result = new TreeSet<>(String.CASE INSENSITIVE ORDER);
    result.addAll(shardingResult);
    return result;
}
```
# SQL执行和归并引擎
