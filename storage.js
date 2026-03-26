/**
 * storage.js - 本地資料存取模組
 * 取代 Vercel KV，使用 localStorage 進行所有資料持久化
 */
const Storage = {
    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.error(`Storage.get error for key "${key}":`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Storage.set error for key "${key}":`, e);
            alert('資料儲存失敗！可能是儲存空間已滿。');
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    // 取得使用者設定（含預設值）
    getSettings() {
        return this.get('userSettings', {
            nickname: '',
            gender: 'male',
            birthYear: 1994,
            heightCm: 175,
            startWeight: 80,
            startBodyfat: 25,
            targetWeight: 70,
            targetBodyfat: 18,
            challengeDays: 90,
            challengeStartDate: new Date().toISOString().split('T')[0],
            dailyCalorieTarget: 2000,
            proteinTarget: 150,
            carbTarget: 200,
            fatTarget: 60
        });
    },

    saveSettings(settings) {
        return this.set('userSettings', settings);
    },

    // 檢查是否已完成初始設定
    hasCompletedSetup() {
        return this.get('setupCompleted', false);
    },

    markSetupCompleted() {
        this.set('setupCompleted', true);
    },

    // 便捷方法：取得各類資料
    getFitnessData() { return this.get('fitnessData', []); },
    saveFitnessData(data) { return this.set('fitnessData', data); },

    getDietLog() { return this.get('dietLog', {}); },
    saveDietLog(data) { return this.set('dietLog', data); },

    getFavoriteFoods() { return this.get('favoriteFoods', []); },
    saveFavoriteFoods(data) { return this.set('favoriteFoods', data); },

    getWorkoutLog() { return this.get('workoutLog', {}); },
    saveWorkoutLog(data) { return this.set('workoutLog', data); },

    getFastingData() { return this.get('fastingData', {}); },
    saveFastingData(data) { return this.set('fastingData', data); },

    // 匯出所有資料（用於備份）
    exportAll() {
        return {
            userSettings: this.getSettings(),
            fitnessData: this.getFitnessData(),
            dietLog: this.getDietLog(),
            favoriteFoods: this.getFavoriteFoods(),
            workoutLog: this.getWorkoutLog(),
            fastingData: this.getFastingData()
        };
    },

    // 匯入資料（用於還原）
    importAll(data) {
        if (data.userSettings) this.saveSettings(data.userSettings);
        if (data.fitnessData) this.saveFitnessData(data.fitnessData);
        if (data.dietLog) this.saveDietLog(data.dietLog);
        if (data.favoriteFoods) this.saveFavoriteFoods(data.favoriteFoods);
        if (data.workoutLog) this.saveWorkoutLog(data.workoutLog);
        if (data.fastingData) this.saveFastingData(data.fastingData);
        return true;
    }
};
