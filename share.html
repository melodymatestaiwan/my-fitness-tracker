<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>產生今日分享圖</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap');
        body {
            font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #e0e0e0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            margin: 0;
        }
        #capture-area {
            width: 1080px; /* IG 正方形尺寸 */
            height: 1080px;
            background-color: #f8f9fa;
            border-radius: 20px;
            padding: 50px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3f51b5;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #1a237e;
            margin: 0;
            font-size: 48px;
        }
        .header p {
            color: #555;
            font-size: 28px;
            margin: 5px 0 0 0;
        }
        .content {
            display: flex;
            gap: 40px;
            flex-grow: 1;
            overflow: hidden;
        }
        .column {
            width: 50%;
            display: flex;
            flex-direction: column;
        }
        .column h2 {
            font-size: 36px;
            color: #1a237e;
            margin-top: 0;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
        .summary-block {
            background-color: #fff;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        .macros-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .macro-item { text-align: center; }
        .macro-item .label { font-size: 22px; color: #3f51b5; }
        .macro-item .values { font-size: 28px; font-weight: bold; }
        .workout-list, .diet-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 22px;
            overflow-y: auto;
        }
        .workout-list li, .diet-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .workout-list li:last-child, .diet-list li:last-child { border-bottom: none; }
        .diet-meal-group h4 { font-size: 24px; color: #555; margin: 15px 0 5px 0; }
        #download-btn {
            margin-top: 20px;
            padding: 15px 30px;
            font-size: 24px;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div id="capture-area">
        <div class="header">
            <h1 id="summary-title">我的健身日誌</h1>
            <p id="summary-date">讀取中...</p>
        </div>
        <div class="content">
            <div class="column">
                <h2>飲食紀錄</h2>
                <div class="summary-block" id="diet-summary-block">讀取中...</div>
                <ul class="diet-list" id="diet-log-list"></ul>
            </div>
            <div class="column">
                <h2>訓練紀錄</h2>
                <div class="summary-block" id="workout-summary-block">讀取中...</div>
                <ul class="workout-list" id="workout-log-list"></ul>
            </div>
        </div>
    </div>
    <button id="download-btn">下載分享圖</button>

<script>
    document.addEventListener('DOMContentLoaded', async () => {
        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];
        document.getElementById('summary-date').textContent = `${today.getFullYear()} / ${today.getMonth() + 1} / ${today.getDate()}`;
        
        let allData;
        try {
            const response = await fetch('/api/getAllData');
            allData = await response.json();
        } catch (error) {
            alert('讀取雲端資料失敗！');
            return;
        }

        const { dietLog, workoutLog } = allData;
        const dietPlan = {
            monday:    { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
            tuesday:   { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
            wednesday: { name: "高碳日", protein: 160, carbs: 230, fat: 51 },
            thursday:  { name: "無碳日", protein: 160, carbs: 40,  fat: 98 },
            friday:    { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
            saturday:  { name: "低碳日", protein: 160, carbs: 100, fat: 87 },
            sunday:    { name: "無碳日", protein: 160, carbs: 40,  fat: 98 },
        };
        const workoutPlan = {
            monday: { dayName: "胸部訓練", exercises: [] }, tuesday: { dayName: "背部訓練", exercises: [] },
            wednesday: { dayName: "腿部訓練", exercises: [] }, thursday: { dayName: "休息日", exercises: [] },
            friday: { dayName: "肩部訓練", exercises: [] }, saturday: { dayName: "手臂訓練", exercises: [] },
            sunday: { dayName: "休息日", exercises: [] },
        };
        const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

        // 渲染飲食部分
        const dayOfWeek = today.getDay();
        const planForDay = dietPlan[dayKeys[dayOfWeek]];
        const logsForDay = dietLog[todayKey] || [];
        const totals = logsForDay.reduce((acc, item) => {
            acc.protein += item.protein; acc.carbs += item.carbs; acc.fat += item.fat; return acc;
        }, { protein: 0, carbs: 0, fat: 0 });
        const currentCalories = (totals.protein * 4) + (totals.carbs * 4) + (totals.fat * 9);
        const targetCalories = (planForDay.protein * 4) + (planForDay.carbs * 4) + (planForDay.fat * 9);
        
        document.getElementById('diet-summary-block').innerHTML = `
            <div class="macros-grid">
                <div class="macro-item"><div class="label">蛋白質</div><div class="values">${totals.protein.toFixed(0)} / ${planForDay.protein}g</div></div>
                <div class="macro-item"><div class="label">碳水</div><div class="values">${totals.carbs.toFixed(0)} / ${planForDay.carbs}g</div></div>
                <div class="macro-item"><div class="label">脂肪</div><div class="values">${totals.fat.toFixed(0)} / ${planForDay.fat}g</div></div>
                <div class="macro-item"><div class="label">總熱量</div><div class="values">${currentCalories.toFixed(0)} / ~${targetCalories.toFixed(0)}</div></div>
            </div>
        `;
        
        const dietListEl = document.getElementById('diet-log-list');
        dietListEl.innerHTML = '';
        const groupedMeals = { breakfast: [], lunch: [], dinner: [], snack: [], uncategorized: [] };
        logsForDay.forEach(item => { (groupedMeals[item.meal || 'uncategorized']).push(item); });
        const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
        const mealNames = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '點心'};
        mealOrder.forEach(mealKey => {
            if (groupedMeals[mealKey].length > 0) {
                const groupEl = document.createElement('div');
                groupEl.className = 'diet-meal-group';
                let groupHTML = `<h4>${mealNames[mealKey]}</h4>`;
                groupedMeals[mealKey].forEach(item => { groupHTML += `<li>${item.name}</li>`; });
                groupEl.innerHTML = groupHTML;
                dietListEl.appendChild(groupEl);
            }
        });

        // 渲染訓練部分
        const workoutDayKey = dayKeys[dayOfWeek];
        const workoutForDay = workoutPlan[workoutDayKey];
        document.getElementById('workout-summary-block').textContent = workoutForDay.dayName;
        const workoutListEl = document.getElementById('workout-log-list');
        workoutListEl.innerHTML = '';
        let hasWorkout = false;
        if(workoutLog[workoutDayKey]) {
            for (const exName in workoutLog[workoutDayKey]) {
                const sets = workoutLog[workoutDayKey][exName][todayKey];
                if (sets && sets.length > 0) {
                    hasWorkout = true;
                    const li = document.createElement('li');
                    const setsText = sets.map(set => (set.type === 'time') ? `${set.duration}min` : `${set.weight}kg x ${set.reps}`).join(', ');
                    li.innerHTML = `<strong>${exName}:</strong> ${setsText}`;
                    workoutListEl.appendChild(li);
                }
            }
        }
        if (!hasWorkout) {
            workoutListEl.innerHTML = '<li>今天沒有訓練紀錄</li>';
        }

        // 綁定下載按鈕
        document.getElementById('download-btn').onclick = () => {
            const element = document.getElementById('capture-area');
            html2canvas(element, { useCORS: true }).then(canvas => {
                const link = document.createElement('a');
                link.download = `fitness-summary-${todayKey}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        };
    });
</script>
</body>
</html>
