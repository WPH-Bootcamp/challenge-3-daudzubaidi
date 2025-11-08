// ============================================
// HABIT TRACKER CLI - CHALLENGE 3
// ============================================
// NAMA: [wph-159-daud] Daud Abdilah Zubaidi
// KELAS: [Batch-3]
// TANGGAL: [8 november 2024]
// ============================================

// Import module yang diperlukan untuk aplikasi CLI
// readline: untuk membaca input dari user
// fs: untuk operasi file (save/load data)
// path: untuk handling path file secara cross-platform
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Definisikan konstanta aplikasi
// DATA_FILE: lokasi file JSON untuk menyimpan data
// REMINDER_INTERVAL: interval reminder dalam milliseconds (10 detik)
// DAYS_IN_WEEK: jumlah hari dalam seminggu
const DATA_FILE = path.join(__dirname, 'habits-data.json');
const REMINDER_INTERVAL = 10000; // 10 detik
const DAYS_IN_WEEK = 7;

// Setup readline interface untuk interaksi dengan user
// Digunakan untuk membaca input dari terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});




// ============================================
// USER PROFILE OBJECT
// ============================================
// Object untuk menyimpan profil user dan statistiknya
// KONSEP: Objek Dasar, Date, filter()
const userProfile = {
    name: 'Daud Abdilah Zubaidi',
    joinDate: new Date(),
    totalHabits: 0,
    completedThisWeek: 0,
    
    // Method untuk update statistik berdasarkan array habits
    // Menggunakan filter() untuk menghitung habits yang selesai minggu ini
    updateStats(habits) {
        this.totalHabits = habits.length;
        // KONSEP: filter() - menyaring habits yang sudah selesai minggu ini
        this.completedThisWeek = habits.filter(h => h.isCompletedThisWeek()).length;
    },
    
    // Method untuk menghitung berapa hari sejak user bergabung
    // KONSEP: Date object dan manipulasi
    getDaysJoined() {
        const now = new Date();
        const diffTime = Math.abs(now - this.joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
};





// ============================================
// HABIT CLASS
// ============================================
// Class untuk merepresentasikan satu kebiasaan
// KONSEP: Class, Array, Date, filter(), find()
class Habit {
    // Constructor untuk inisialisasi habit baru
    constructor(name, targetFrequency) {
        this.id = Date.now(); // ID unik menggunakan timestamp
        this.name = name;
        this.targetFrequency = targetFrequency; // Target berapa kali per minggu
        this.completions = []; // Array untuk menyimpan tanggal completion
        this.createdAt = new Date();
    }
    
    // Method untuk menandai habit selesai untuk hari ini
    // KONSEP: Array, Date
    markComplete() {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time ke midnight untuk perbandingan
        
        // Cek apakah sudah complete hari ini menggunakan find()
        // KONSEP: find() - mencari elemen dalam array
        const alreadyCompleted = this.completions.find(date => {
            const completionDate = new Date(date);
            completionDate.setHours(0, 0, 0, 0);
            return completionDate.getTime() === today.getTime();
        });
        
        if (!alreadyCompleted) {
            this.completions.push(today);
            return true;
        }
        return false;
    }
    
    // Method untuk mendapatkan jumlah completion minggu ini
    // KONSEP: filter(), Date
    getThisWeekCompletions() {
        const now = new Date();
        const weekStart = new Date(now);
        // Set ke hari Senin minggu ini
        weekStart.setDate(now.getDate() - now.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);
        
        // KONSEP: filter() - menyaring completion minggu ini
        return this.completions.filter(date => {
            const completionDate = new Date(date);
            return completionDate >= weekStart;
        }).length;
    }
    
    // Method untuk cek apakah habit sudah mencapai target minggu ini
    isCompletedThisWeek() {
        return this.getThisWeekCompletions() >= this.targetFrequency;
    }
    
    // Method untuk menghitung persentase progress
    getProgressPercentage() {
        const current = this.getThisWeekCompletions();
        const target = this.targetFrequency;
        return Math.min(Math.round((current / target) * 100), 100);
    }
    
    // Method untuk mendapatkan status habit (Aktif/Selesai)
    getStatus() {
        return this.isCompletedThisWeek() ? 'Selesai' : 'Aktif';
    }
}





// ============================================
// HABIT TRACKER CLASS
// ============================================
// Class utama untuk mengelola seluruh aplikasi habit tracker
// KONSEP: Class, Array, filter(), map(), find(), forEach(), Date, setInterval, JSON, Nullish coalescing
class HabitTracker {
    // Constructor untuk inisialisasi tracker
    constructor() {
        this.habits = []; // Array untuk menyimpan semua habits
        this.reminderTimer = null; // Timer untuk reminder
        this.loadFromFile(); // Load data dari file saat start
    }
    
    // ===== CRUD OPERATIONS =====
    
    // Method untuk menambah habit baru
    // KONSEP: Array
    addHabit(name, frequency) {
        const habit = new Habit(name, frequency);
        this.habits.push(habit);
        this.saveToFile();
        return habit;
    }
    
    // Method untuk menandai habit selesai
    // KONSEP: Nullish coalescing operator (??)
    completeHabit(habitIndex) {
        // KONSEP: ?? operator - gunakan null jika undefined
        const habit = this.habits[habitIndex - 1] ?? null;
        
        if (habit === null) {
            return { success: false, message: 'Habit tidak ditemukan!' };
        }
        
        const success = habit.markComplete();
        if (success) {
            this.saveToFile();
            return { success: true, message: `Habit "${habit.name}" berhasil ditandai selesai!` };
        } else {
            return { success: false, message: `Habit "${habit.name}" sudah selesai hari ini!` };
        }
    }
    
    // Method untuk menghapus habit
    // KONSEP: Array splice
    deleteHabit(habitIndex) {
        // KONSEP: ?? operator
        const habit = this.habits[habitIndex - 1] ?? null;
        
        if (habit === null) {
            return { success: false, message: 'Habit tidak ditemukan!' };
        }
        
        const habitName = habit.name;
        this.habits.splice(habitIndex - 1, 1);
        this.saveToFile();
        return { success: true, message: `Habit "${habitName}" berhasil dihapus!` };
    }
    
    // ===== DISPLAY METHODS =====
    
    // Method untuk menampilkan profil user
    // KONSEP: Object, Date
    displayProfile() {
        userProfile.updateStats(this.habits);
        
        console.log('\n==================================================');
        console.log('PROFIL PENGGUNA');
        console.log('==================================================');
        console.log(`Nama: ${userProfile.name}`);
        console.log(`Bergabung sejak: ${userProfile.joinDate.toLocaleDateString('id-ID')}`);
        console.log(`Hari bergabung: ${userProfile.getDaysJoined()} hari`);
        console.log(`Total Kebiasaan: ${userProfile.totalHabits}`);
        console.log(`Selesai Minggu Ini: ${userProfile.completedThisWeek}`);
        console.log('==================================================\n');
    }
    
    // Method untuk menampilkan habits dengan filter
    // KONSEP: filter(), forEach()
    displayHabits(filterType = 'all') {
        let habitsToDisplay = this.habits;
        let title = 'SEMUA KEBIASAAN';
        
        // KONSEP: filter() untuk menyaring habits berdasarkan status
        if (filterType === 'active') {
            habitsToDisplay = this.habits.filter(h => !h.isCompletedThisWeek());
            title = 'KEBIASAAN AKTIF';
        } else if (filterType === 'completed') {
            habitsToDisplay = this.habits.filter(h => h.isCompletedThisWeek());
            title = 'KEBIASAAN SELESAI';
        }
        
        console.log('\n==================================================');
        console.log(title);
        console.log('==================================================');
        
        if (habitsToDisplay.length === 0) {
            console.log('Tidak ada kebiasaan untuk ditampilkan.');
            console.log('==================================================\n');
            return;
        }
        
        // KONSEP: forEach() untuk iterasi dan menampilkan setiap habit
        habitsToDisplay.forEach((habit, index) => {
            const current = habit.getThisWeekCompletions();
            const target = habit.targetFrequency;
            const percentage = habit.getProgressPercentage();
            const progressBar = this.generateProgressBar(percentage);
            
            console.log(`\n${this.habits.indexOf(habit) + 1}. [${habit.getStatus()}] ${habit.name}`);
            console.log(`   Target: ${target}x/minggu`);
            console.log(`   Progress: ${current}/${target} (${percentage}%)`);
            console.log(`   Progress Bar: ${progressBar} ${percentage}%`);
        });
        
        console.log('\n==================================================\n');
    }
    
    // Method untuk menampilkan habits menggunakan while loop
    // KONSEP: while loop
    displayHabitsWithWhile() {
        console.log('\n==================================================');
        console.log('DEMO WHILE LOOP - MENAMPILKAN HABITS');
        console.log('==================================================');
        
        if (this.habits.length === 0) {
            console.log('Tidak ada kebiasaan untuk ditampilkan.');
            console.log('==================================================\n');
            return;
        }
        
        let i = 0;
        // KONSEP: while loop - iterasi menggunakan kondisi
        while (i < this.habits.length) {
            const habit = this.habits[i];
            console.log(`${i + 1}. ${habit.name} - Status: ${habit.getStatus()}`);
            i++;
        }
        
        console.log('==================================================\n');
    }
    
    // Method untuk menampilkan habits menggunakan for loop
    // KONSEP: for loop
    displayHabitsWithFor() {
        console.log('\n==================================================');
        console.log('DEMO FOR LOOP - MENAMPILKAN HABITS');
        console.log('==================================================');
        
        if (this.habits.length === 0) {
            console.log('Tidak ada kebiasaan untuk ditampilkan.');
            console.log('==================================================\n');
            return;
        }
        
        // KONSEP: for loop - iterasi dengan counter
        for (let i = 0; i < this.habits.length; i++) {
            const habit = this.habits[i];
            console.log(`${i + 1}. ${habit.name} - Target: ${habit.targetFrequency}x/minggu`);
        }
        
        console.log('==================================================\n');
    }
    
    // Method untuk menampilkan statistik
    // KONSEP: filter(), map(), reduce (via length)
    displayStats() {
        console.log('\n==================================================');
        console.log('STATISTIK KEBIASAAN');
        console.log('==================================================');
        
        if (this.habits.length === 0) {
            console.log('Belum ada data untuk ditampilkan.');
            console.log('==================================================\n');
            return;
        }
        
        const totalHabits = this.habits.length;
        
        // KONSEP: filter() untuk menghitung berbagai kategori
        const completedHabits = this.habits.filter(h => h.isCompletedThisWeek()).length;
        const activeHabits = this.habits.filter(h => !h.isCompletedThisWeek()).length;
        
        // KONSEP: map() untuk transform data ke bentuk lain
        const completionCounts = this.habits.map(h => h.getThisWeekCompletions());
        const totalCompletions = completionCounts.reduce((sum, count) => sum + count, 0);
        
        // KONSEP: map() untuk mendapatkan list nama habits
        const habitNames = this.habits.map(h => h.name);
        
        console.log(`Total Kebiasaan: ${totalHabits}`);
        console.log(`Kebiasaan Aktif: ${activeHabits}`);
        console.log(`Kebiasaan Selesai: ${completedHabits}`);
        console.log(`Total Completion Minggu Ini: ${totalCompletions}`);
        console.log(`\nDaftar Kebiasaan:`);
        
        // KONSEP: forEach() untuk menampilkan list
        habitNames.forEach((name, index) => {
            console.log(`  ${index + 1}. ${name}`);
        });
        
        console.log('==================================================\n');
    }
    
    // Helper method untuk generate progress bar ASCII
    generateProgressBar(percentage) {
        const totalBars = 10;
        const filledBars = Math.round((percentage / 100) * totalBars);
        const emptyBars = totalBars - filledBars;
        
        const filled = '█'.repeat(filledBars);
        const empty = '░'.repeat(emptyBars);
        
        return filled + empty;
    }
    
    // ===== REMINDER SYSTEM =====
    
    // Method untuk memulai reminder otomatis
    // KONSEP: setInterval
    startReminder() {
        if (this.reminderTimer !== null) {
            return; // Sudah berjalan
        }
        
        // KONSEP: setInterval - menjalankan fungsi secara berulang dengan interval tertentu
        this.reminderTimer = setInterval(() => {
            this.showReminder();
        }, REMINDER_INTERVAL);
        
        console.log('\n[INFO] Reminder otomatis telah diaktifkan (setiap 10 detik)\n');
    }
    
    // Method untuk menampilkan reminder
    // KONSEP: filter(), Date
    showReminder() {
        // Filter habits yang belum selesai hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // KONSEP: filter() untuk mendapatkan habits yang belum complete hari ini
        const incompleteToday = this.habits.filter(habit => {
            const completedToday = habit.completions.find(date => {
                const completionDate = new Date(date);
                completionDate.setHours(0, 0, 0, 0);
                return completionDate.getTime() === today.getTime();
            });
            return !completedToday;
        });
        
        if (incompleteToday.length > 0) {
            const randomHabit = incompleteToday[Math.floor(Math.random() * incompleteToday.length)];
            console.log('\n==================================================');
            console.log(`⏰ REMINDER: Jangan lupa "${randomHabit.name}"!`);
            console.log('==================================================\n');
        }
    }
    
    // Method untuk menghentikan reminder
    stopReminder() {
        if (this.reminderTimer !== null) {
            clearInterval(this.reminderTimer);
            this.reminderTimer = null;
            console.log('\n[INFO] Reminder otomatis telah dinonaktifkan\n');
        }
    }
    
    // ===== FILE OPERATIONS =====
    
    // Method untuk menyimpan data ke file JSON
    // KONSEP: JSON.stringify, fs
    saveToFile() {
        try {
            const data = {
                userProfile: {
                    name: userProfile.name,
                    joinDate: userProfile.joinDate,
                    totalHabits: userProfile.totalHabits,
                    completedThisWeek: userProfile.completedThisWeek
                },
                habits: this.habits
            };
            
            // KONSEP: JSON.stringify - convert JavaScript object ke JSON string
            const jsonData = JSON.stringify(data, null, 2);
            fs.writeFileSync(DATA_FILE, jsonData, 'utf8');
        } catch (error) {
            console.error('[ERROR] Gagal menyimpan data:', error.message);
        }
    }
    
    // Method untuk memuat data dari file JSON
    // KONSEP: JSON.parse, fs, Nullish coalescing
    loadFromFile() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                const jsonData = fs.readFileSync(DATA_FILE, 'utf8');
                
                // KONSEP: JSON.parse - convert JSON string ke JavaScript object
                const data = JSON.parse(jsonData);
                
                // KONSEP: ?? operator - gunakan default value jika undefined/null
                userProfile.name = data.userProfile?.name ?? userProfile.name;
                userProfile.joinDate = new Date(data.userProfile?.joinDate ?? new Date());
                userProfile.totalHabits = data.userProfile?.totalHabits ?? 0;
                userProfile.completedThisWeek = data.userProfile?.completedThisWeek ?? 0;
                
                // Load habits dan recreate sebagai Habit objects
                // KONSEP: map() untuk transform raw data ke Habit objects
                this.habits = (data.habits ?? []).map(habitData => {
                    const habit = new Habit(habitData.name, habitData.targetFrequency);
                    habit.id = habitData.id;
                    habit.completions = habitData.completions.map(d => new Date(d));
                    habit.createdAt = new Date(habitData.createdAt);
                    return habit;
                });
                
                console.log('[INFO] Data berhasil dimuat dari file\n');
            }
        } catch (error) {
            console.error('[ERROR] Gagal memuat data:', error.message);
        }
    }
    
    // Method untuk menghapus semua data
    clearAllData() {
        this.habits = [];
        this.saveToFile();
        console.log('[INFO] Semua data telah dihapus\n');
    }
}





// ============================================
// HELPER FUNCTIONS
// ============================================

// Function untuk membaca input dari user
// Mengembalikan Promise untuk digunakan dengan async/await
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Function untuk menampilkan menu utama
function displayMenu() {
    console.log('\n==================================================');
    console.log('HABIT TRACKER - MAIN MENU');
    console.log('==================================================');
    console.log('1. Lihat Profil');
    console.log('2. Lihat Semua Kebiasaan');
    console.log('3. Lihat Kebiasaan Aktif');
    console.log('4. Lihat Kebiasaan Selesai');
    console.log('5. Tambah Kebiasaan Baru');
    console.log('6. Tandai Kebiasaan Selesai');
    console.log('7. Hapus Kebiasaan');
    console.log('8. Lihat Statistik');
    console.log('9. Demo Loop (while/for)');
    console.log('0. Keluar');
    console.log('==================================================');
}

// Function untuk menangani pilihan menu user
async function handleMenu(tracker) {
    let running = true;
    
    // Loop utama aplikasi - berjalan sampai user memilih keluar
    while (running) {
        displayMenu();
        const choice = await askQuestion('Pilih menu (0-9): ');
        
        // Switch case untuk handle setiap pilihan menu
        switch (choice) {
            case '1':
                // Menu 1: Lihat Profil
                tracker.displayProfile();
                break;
                
            case '2':
                // Menu 2: Lihat Semua Kebiasaan
                tracker.displayHabits('all');
                break;
                
            case '3':
                // Menu 3: Lihat Kebiasaan Aktif
                tracker.displayHabits('active');
                break;
                
            case '4':
                // Menu 4: Lihat Kebiasaan Selesai
                tracker.displayHabits('completed');
                break;
                
            case '5':
                // Menu 5: Tambah Kebiasaan Baru
                console.log('\n--- TAMBAH KEBIASAAN BARU ---');
                const habitName = await askQuestion('Nama kebiasaan: ');
                const frequency = await askQuestion('Target per minggu (1-7): ');
                
                const targetFreq = parseInt(frequency);
                if (targetFreq >= 1 && targetFreq <= 7) {
                    tracker.addHabit(habitName, targetFreq);
                    console.log(`\n✓ Kebiasaan "${habitName}" berhasil ditambahkan!\n`);
                } else {
                    console.log('\n✗ Target harus antara 1-7!\n');
                }
                break;
                
            case '6':
                // Menu 6: Tandai Kebiasaan Selesai
                tracker.displayHabits('all');
                if (tracker.habits.length > 0) {
                    const index = await askQuestion('Pilih nomor kebiasaan yang selesai: ');
                    const result = tracker.completeHabit(parseInt(index));
                    console.log(`\n${result.success ? '✓' : '✗'} ${result.message}\n`);
                }
                break;
                
            case '7':
                // Menu 7: Hapus Kebiasaan
                tracker.displayHabits('all');
                if (tracker.habits.length > 0) {
                    const index = await askQuestion('Pilih nomor kebiasaan yang akan dihapus: ');
                    const result = tracker.deleteHabit(parseInt(index));
                    console.log(`\n${result.success ? '✓' : '✗'} ${result.message}\n`);
                }
                break;
                
            case '8':
                // Menu 8: Lihat Statistik
                tracker.displayStats();
                break;
                
            case '9':
                // Menu 9: Demo Loop
                console.log('\n--- DEMO LOOP ---');
                tracker.displayHabitsWithWhile();
                await askQuestion('Tekan Enter untuk lanjut ke demo FOR loop...');
                tracker.displayHabitsWithFor();
                break;
                
            case '0':
                // Menu 0: Keluar
                console.log('\n==================================================');
                console.log('Terima kasih telah menggunakan Habit Tracker!');
                console.log('Data Anda telah tersimpan otomatis.');
                console.log('==================================================\n');
                tracker.stopReminder();
                running = false;
                rl.close();
                break;
                
            default:
                console.log('\n✗ Pilihan tidak valid! Silakan pilih 0-9.\n');
        }
        
        // Pause sebelum kembali ke menu (kecuali sudah keluar)
        if (running && choice !== '9') {
            await askQuestion('\nTekan Enter untuk kembali ke menu...');
        }
    }
}





// ============================================
// MAIN FUNCTION
// ============================================
// Function utama untuk menjalankan aplikasi
async function main() {
    // Tampilkan banner aplikasi
    console.clear();
    console.log('==================================================');
    console.log('       HABIT TRACKER CLI - CHALLENGE 3');
    console.log('==================================================');
    console.log('  Aplikasi untuk melacak kebiasaan harian Anda');
    console.log('==================================================');
    console.log(`  Developer: ${userProfile.name}`);
    console.log(`  Tanggal: ${new Date().toLocaleDateString('id-ID')}`);
    console.log('==================================================\n');
    
    // Buat instance HabitTracker
    const tracker = new HabitTracker();
    
    // Tanya user apakah ingin menambahkan data demo
    if (tracker.habits.length === 0) {
        console.log('[INFO] Tidak ada data kebiasaan yang ditemukan.\n');
        const addDemo = await askQuestion('Apakah Anda ingin menambahkan data demo? (y/n): ');
        
        if (addDemo.toLowerCase() === 'y') {
            // Tambah beberapa habit demo
            tracker.addHabit('Minum Air 8 Gelas', 7);
            tracker.addHabit('Baca Buku 30 Menit', 5);
            tracker.addHabit('Olahraga Pagi', 4);
            tracker.addHabit('Meditasi', 7);
            tracker.addHabit('Belajar Programming', 5);
            
            // Mark beberapa habit sebagai complete untuk demo
            tracker.completeHabit(1);
            tracker.completeHabit(2);
            tracker.completeHabit(2);
            
            console.log('\n✓ Data demo berhasil ditambahkan!\n');
            await askQuestion('Tekan Enter untuk melanjutkan...');
        }
    }
    
    // Start reminder otomatis
    tracker.startReminder();
    
    // Jalankan menu handler
    await handleMenu(tracker);
}

// Jalankan aplikasi dengan error handling
main().catch(error => {
    console.error('\n[ERROR] Terjadi kesalahan:', error.message);
    console.error(error.stack);
    rl.close();
    process.exit(1);
});

