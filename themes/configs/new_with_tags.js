const { spawnSync } = require('child_process');
const hexo = hexo || {};

hexo.extend.filter.register('before_post_render', function (data) {
  // 从命令行参数中获取标签和分类
  const tags = process.argv.includes('--tags') ? process.argv[process.argv.indexOf('--tags') + 1].split(',') : [];
//   const categories = process.argv.includes('--categories') ? process.argv[process.argv.indexOf('--categories') + 1].split(',') : [];

  // 将标签和分类添加到 Front Matter
  if (tags.length > 0) {
    data.tags = tags;
  }
//   if (categories.length > 0) {
//     data.categories = categories;
//   }

  return data;
});

// 覆盖 hexo new 命令
hexo.extend.filter.register('after_init', function () {
  const args = process.argv.slice(2);
  if (args[0] === 'new') {
    const title = args[1];
    const tags = args.includes('--tags') ? args[args.indexOf('--tags') + 1] : '';
    // const categories = args.includes('--categories') ? args[args.indexOf('--categories') + 1] : '';

    // 生成新文章
    spawnSync('hexo', ['new', title], { stdio: 'inherit' });

    // 输出提示信息
    console.log(`文章已创建，标签：${tags}，分类：${categories}`);
  }
});