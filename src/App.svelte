<script>
  // —— 简单 CSV 解析 —— 
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
      const cols = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        const v = cols[i];
        const n = Number(v);
        obj[h] = Number.isFinite(n) ? n : v;
      });
      return obj;
    });
  }
  const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString("zh-CN") : "0");

  // —— 数据与映射 —— 
  let rows = [];          
  let mappingRoot = {};   
  let M = null;           

  // —— 初始条件 —— 
  let ageMin = 18, ageMax = 45;          
  let heightMin = 150, heightMax = 200;  

  // 有序最低档
  let minEducation = "";       
  let minIncome = "";          
  let minAssets = "";          

  // 评分
  let face = 1, humor = 1, sexAttract = 1, body = 1;

  // 多选
  let marital = [];
  let property = [];
  let hometown = [];
  let location = [];
  let smoking = [];
  let drinking = [];
  let vision = [];
  let health = [];
  let religion = [];

  // 下拉选项
  let educationOptions = [];
  let incomeOptions = [];
  let assetsOptions = [];

  // —— 展示结果 —— 
  const SAMPLE_SIZE = 1_000_000;
  const TOTAL_MALE = 700_000_000;

  let matchedCount = 0;            
  let matchedPercent = 0;
  let scopeRating = '';
  let perMillion = 0;              
  let nationalEstimate = 0;        

  let scopeDenom = 0;              
  let scopePercent = 0;            
  let scopePerMillion = 0;         

  // —— 加载 —— 
  async function loadAll() {
    const mapRes = await fetch("/data/mappings.json");
    mappingRoot = await mapRes.json();
    M = mappingRoot.mappings ?? mappingRoot;

    const sortAsc = (obj) => Object.entries(obj).sort((a, b) => a[1] - b[1]).map(([k]) => k);
    educationOptions = sortAsc(M.education);
    incomeOptions    = sortAsc(M.income);
    assetsOptions    = sortAsc(M.personal_assets);

    marital  = Object.keys(M.marital_status);
    property = Object.keys(M.property_status);
    hometown = Object.keys(M.hometown);
    location = Object.keys(M.current_location);
    smoking  = Object.keys(M.smoking_habit);
    drinking = Object.keys(M.drinking_habit);
    vision   = Object.keys(M.vision);
    health   = Object.keys(M.health_status);
    religion = Object.keys(M.religion);

    const csvRes = await fetch("/data/hermatch.csv");
    const text = await csvRes.text();
    rows = parseCSV(text);

    applyFilters();
  }
  loadAll();

  // —— 过滤逻辑 —— 
  function applyFilters() {
    if (!rows.length || !M) {
      matchedCount = matchedPercent = perMillion = nationalEstimate = 0;
      scopeRating = '';
      scopeDenom = scopePercent = scopePerMillion = 0;
      return;
    }

    const toSet = (labels, mapObj) => new Set(labels.map(l => mapObj[l]));
    const maritalSet  = toSet(marital,  M.marital_status);
    const propertySet = toSet(property, M.property_status);
    const hometownSet = toSet(hometown, M.hometown);
    const locationSet = toSet(location, M.current_location);
    const smokingSet  = toSet(smoking,  M.smoking_habit);
    const drinkingSet = toSet(drinking, M.drinking_habit);
    const visionSet   = toSet(vision,   M.vision);
    const healthSet   = toSet(health,   M.health_status);
    const religionSet = toSet(religion, M.religion);

    const eduMin = minEducation ? M.education[minEducation] : null;
    const incMin = minIncome ? M.income[minIncome] : null;
    const astMin = minAssets ? M.personal_assets[minAssets] : null;

    const scope = rows.filter(r => r.age >= ageMin && r.age <= ageMax);
    scopeDenom = scope.length;

    const passed = scope.filter(r => {
      if (r.height < heightMin || r.height > heightMax) return false;

      if (eduMin !== null && r.education < eduMin) return false;
      if (incMin !== null && r.income < incMin) return false;
      if (astMin !== null && r.personal_assets < astMin) return false;

      if (r.face_score < face-1) return false;
      if (r.humor_score < humor-1) return false;
      if (r.body_score < body-1) return false;
      if (r.sex_attract_score < sexAttract-1) return false;

      if (!maritalSet.has(r.marital_status)) return false;
      if (!propertySet.has(r.property_status)) return false;
      if (!hometownSet.has(r.hometown)) return false;
      if (!locationSet.has(r.current_location)) return false;
      if (!smokingSet.has(r.smoking_habit)) return false;
      if (!drinkingSet.has(r.drinking_habit)) return false;
      if (!visionSet.has(r.vision)) return false;
      if (!healthSet.has(r.health_status)) return false;
      if (!religionSet.has(r.religion)) return false;

      return true;
    });

    matchedCount = passed.length;

    const pAll = rows.length ? matchedCount / rows.length : 0;
    matchedPercent = pAll * 100;
    perMillion = Math.round(SAMPLE_SIZE * pAll);
    nationalEstimate = Math.round(TOTAL_MALE * pAll);

    const pScope = scopeDenom ? passed.length / scopeDenom : 0;
    scopePercent = pScope * 100;
    if (scopePercent === 0) {
      scopeRating = '🤷‍♂️ 此人只应天上有';
    } else if (scopePercent < 0.0015) {
      scopeRating = '💎 钻石王老五 不要跑！！！！！';
    } else if (scopePercent < 0.015) {
      scopeRating = '🚀 万里挑一的极品！！！！';
    } else if (scopePercent < 0.15) {
      scopeRating = '🏆 大众眼中的精英！！！';
    } else if (scopePercent < 1.5) {
      scopeRating = '💯 百里挑一！！';
    } else if (scopePercent < 5.5) {
      scopeRating = '🔝 名列前茅！';
    } else if (scopePercent < 21) {
      scopeRating = '❗ 崭露头角';
    } else if (scopePercent < 51) {
      scopeRating = '👌 超越半数男性';
    } else {
      scopeRating = '';
    }
    
    scopePerMillion = Math.round(SAMPLE_SIZE * pScope);
  }

  // —— 滑块事件 —— 
  function onAgeMin(e){ ageMin = +e.target.value; if (ageMin > ageMax) ageMax = ageMin; applyFilters(); }
  function onAgeMax(e){ ageMax = +e.target.value; if (ageMax < ageMin) ageMin = ageMax; applyFilters(); }
  function onHeightMin(e){ heightMin = +e.target.value; if (heightMin > heightMax) heightMax = heightMin; applyFilters(); }
  function onHeightMax(e){ heightMax = +e.target.value; if (heightMax < heightMin) heightMin = heightMax; applyFilters(); }
</script>

<main class="min-h-screen bg-gray-900 text-gray-100 p-4">
  <div class="max-w-6xl mx-auto space-y-4">
    <!-- 标题 -->
      <div class="text-center py-4">
        <h1 class="text-2xl md:text-3xl font-extrabold text-red-400">
          中国优质男性数据
        </h1>
        <p class="text-gray-400 mt-2 text-sm">
          数据来源：<a href="https://github.com/hongtaoh/ChineseMenData" target="_blank" class="underline text-blue-400">ChineseMenData</a> ｜ 
          源代码：<a href="https://github.com/hongtaoh/hermatch_svelte" target="_blank" class="underline text-blue-400">hermatch_svelte</a>
        </p>
    </div>
    <!-- 卡片 1 -->
    <div class="bg-gray-800 rounded-xl p-4 shadow">
      <p>
        每「一百万」中国男性中有：
        <span class="text-red-400 font-extrabold text-lg">{fmt(perMillion)}</span>
        人符合，占比
        <span class="text-red-400 font-extrabold text-lg">{matchedPercent.toFixed(3)}%</span>
      </p>
      <p class="mt-2 text-sm text-gray-400">
        全国约 7 亿 男性中，大约有：
        <span class="text-red-400 font-semibold">{fmt(nationalEstimate)}</span> 人符合
      </p>
    </div>

    <!-- 卡片 2 -->
    <div class="bg-gray-800 rounded-xl p-4 shadow" style="position: sticky; top: 0">
      <p>
        在你所选择的 <span class="font-semibold">{ageMin}–{ageMax}</span> 岁年龄段中，
        每「一百万」中国男性中有：
        <span class="text-red-400 font-extrabold text-lg">{fmt(scopePerMillion)}</span>
        人符合
        {#if scopeRating}
          ，<span class="text-red-400 font-extrabold text-lg">{scopeRating}</span>
        {/if}
        ，占比<span class="text-red-400 font-extrabold text-lg">{scopePercent.toFixed(3)}%</span>
        <span class="text-xs text-gray-400">（分母=该年龄段样本数）</span>
      </p>
    </div>

    <!-- 条件 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">

      <!-- 年龄 -->
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最小年龄 {ageMin}</h3>
        <input type="range" min="0" max="100" value={ageMin} on:input={onAgeMin} class="w-full" />
        <h3 class="font-semibold">最大年龄 {ageMax}</h3>
        <input type="range" min="0" max="100" value={ageMax} on:input={onAgeMax} class="w-full" />
      </div>

      <!-- 身高 -->
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最小身高 {heightMin} cm</h3>
        <input type="range" min="150" max="200" value={heightMin} on:input={onHeightMin} class="w-full" />
        <h3 class="font-semibold">最大身高 {heightMax} cm</h3>
        <input type="range" min="150" max="200" value={heightMax} on:input={onHeightMax} class="w-full" />
      </div>

      <!-- 三个下拉：学历、收入、资产 -->
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低学历</h3>
        <select class="w-full p-2 rounded bg-gray-700" bind:value={minEducation} on:change={applyFilters}>
          <option value="">不限</option>
          {#if M}{#each educationOptions as o}<option>{o}</option>{/each}{/if}
        </select>
      </div>
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低年收入</h3>
        <select class="w-full p-2 rounded bg-gray-700" bind:value={minIncome} on:change={applyFilters}>
          <option value="">不限</option>
          {#if M}{#each incomeOptions as o}<option>{o}</option>{/each}{/if}
        </select>
      </div>
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低个人总资产</h3>
        <select class="w-full p-2 rounded bg-gray-700" bind:value={minAssets} on:change={applyFilters}>
          <option value="">不限</option>
          {#if M}{#each assetsOptions as o}<option>{o}</option>{/each}{/if}
        </select>
      </div>

      <!-- 四个评分 -->
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低颜值：{face}</h3>
        <label class="block"><input type="range" min="1" max="5" bind:value={face} on:input={applyFilters} class="w-full" /></label>
      </div>
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低幽默：{humor}</h3>
        <label class="block"><input type="range" min="1" max="5" bind:value={humor} on:input={applyFilters} class="w-full" /></label>
      </div>
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低性吸引力：{sexAttract}</h3>
        <label class="block"><input type="range" min="1" max="5" bind:value={sexAttract} on:input={applyFilters} class="w-full" /></label>
      </div>
      <div class="bg-gray-800 p-3 rounded shadow space-y-2">
        <h3 class="font-semibold">最低身材：{body}</h3>
        <label class="block"><input type="range" min="1" max="5" bind:value={body} on:input={applyFilters} class="w-full" /></label>
      </div>

      <!-- 多选 -->
      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">婚姻状况</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.marital_status) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={marital} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">房产情况</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.property_status) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={property} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">家庭所在地</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.hometown) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={hometown} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">目前所在地</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.current_location) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={location} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">吸烟习惯</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.smoking_habit) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={smoking} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">饮酒习惯</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.drinking_habit) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={drinking} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">视力</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.vision) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={vision} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">健康状况</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.health_status) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={health} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

      <div class="bg-gray-800 p-3 rounded shadow">
        <h3 class="font-semibold mb-2">宗教信仰</h3>
        <div class="flex flex-wrap gap-3 text-sm">
          {#if M}{#each Object.keys(M.religion) as o}
            <label class="inline-flex items-center gap-1"><input type="checkbox" value={o} bind:group={religion} on:change={applyFilters} class="accent-red-500" />{o}</label>
          {/each}{/if}
        </div>
      </div>

    </div>
  </div>
</main>
