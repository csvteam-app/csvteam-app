import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'danielecsv2001@gmail.com';
const TEST_PASS = 'CSVhalo117!';

async function runE2E() {
    console.log("=== STARTING GLOBAL INTEGRATION TEST ===\\n");
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // 1. Authentication
        console.log("--- 1. Testing Authentication ---");
        let coachId;

        // Try to login with a test account
        const testAccountEmail = 'e2e_coach_test@csvteam.com';
        const testAccountPass = 'TestPassword123!';

        let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: testAccountEmail,
            password: testAccountPass
        });

        if (authErr) {
            console.log("Test account login failed, attempting to sign up...");
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
                email: testAccountEmail,
                password: testAccountPass,
                options: {
                    data: {
                        name: 'E2E Test Coach',
                        role: 'coach'
                    }
                }
            });

            if (signUpErr) {
                console.error("SignUp Error:", signUpErr.message);
                throw new Error("Could not create test user");
            }

            if (!signUpData.session) {
                console.error("SignUp requires email confirmation. Cannot proceed with E2E tests automatically.");
                throw new Error("Email confirmation required");
            }

            authData = signUpData;
        }

        assert(authData?.session, `Authenticated as ${testAccountEmail}`);
        coachId = authData?.user?.id;

        if (!coachId) throw new Error("No user ID found");

        // Force role to coach in profiles if we just created it (this might fail if RLS prevents it, but let's try)
        await supabase.from('profiles').update({ role: 'coach' }).eq('id', coachId);

        // Verify role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', coachId).single();
        assert(profile && ['coach', 'superadmin'].includes(profile.role), "User is Coach/Superadmin");

        // We need a dummy athlete ID for Foreign Keys (assuming the coach is also an athlete or we can just pick one)
        const { data: anyAthlete } = await supabase.from('profiles').select('id').eq('role', 'athlete').limit(1).single();
        const athleteId = anyAthlete ? anyAthlete.id : coachId; // fallback to coach ID if no athlete exists

        // 2. Core Coaching Loop: Exercises & Programs
        console.log("\\n--- 2. Testing Core Coaching Loop ---");

        // Exercise Library (CRUD)
        const mockExerciseId = crypto.randomUUID();
        const { error: exInsErr } = await supabase.from('exercises').insert({
            id: mockExerciseId,
            name: 'Integration Test Squat',
            primary_muscle_group: 'Legs',
            difficulty: 'Intermediate'
        });
        assert(!exInsErr, "Coach can create Exercise");

        const { error: exDelErr } = await supabase.from('exercises').delete().eq('id', mockExerciseId);
        assert(!exDelErr, "Coach can delete Exercise");

        // Program Builder
        const mockProgramId = crypto.randomUUID();
        const { error: progInsErr } = await supabase.from('programs').insert({
            id: mockProgramId,
            title: 'Integration Test Program',
            duration_weeks: 4,
            split_type: 'Full Body'
        });
        assert(!progInsErr, "Coach can create Program");

        const { error: progDelErr } = await supabase.from('programs').delete().eq('id', mockProgramId);
        assert(!progDelErr, "Coach can delete Program (Cascade should clean up days/exercises)");


        // 3. V2 Features: Workout Sessions & Logbook
        console.log("\\n--- 3. Testing V2 Features (Workout) ---");
        const dummySessionId = crypto.randomUUID();
        // We'll just test if we can insert a workout session. Wait, we need a valid program_day_id.
        // We might fail foreign key constraints if we use a random UUID.
        // Let's just create a dummy day first.
        const d_prog = crypto.randomUUID();
        await supabase.from('programs').insert({ id: d_prog, title: 'Temp' });
        const d_day = crypto.randomUUID();
        await supabase.from('program_days').insert({ id: d_day, program_id: d_prog, day_number: 1, title: 'Day 1' });

        const { error: wsErr } = await supabase.from('workout_sessions').insert({
            id: dummySessionId,
            athlete_id: athleteId,
            program_day_id: d_day
        });
        assert(!wsErr, "Created Workout Session");

        // Clean up dummy program (cascades session and days)
        await supabase.from('programs').delete().eq('id', d_prog);


        // 4. V2 Features: Lessons & Academy
        console.log("\\n--- 4. Testing V2 Features (Academy) ---");
        const dummyLessonId = crypto.randomUUID();
        const { error: lessErr } = await supabase.from('lessons').insert({
            id: dummyLessonId,
            title: 'Test Lesson',
            category: 'Testing'
        });
        assert(!lessErr, "Coach can create Academy Lesson");

        const { error: lessCompErr } = await supabase.from('user_lessons_completed').insert({
            athlete_id: athleteId,
            lesson_id: dummyLessonId
        });
        assert(!lessCompErr, "Athlete can complete Lesson");

        await supabase.from('lessons').delete().eq('id', dummyLessonId);

        // 5. V2 Features: Gamification & Nutrition
        console.log("\\n--- 5. Testing V2 Features (Gamification & Nutrition) ---");
        // Update gamification
        const { error: gamErr } = await supabase.from('gamification_profiles')
            .update({ xp: 100 })
            .eq('id', athleteId);
        assert(!gamErr, "Coach can update Gamification Profile XP");

        // Nutrition log
        const { error: nutErr } = await supabase.from('nutrition_logs').insert({
            athlete_id: athleteId,
            date: new Date().toISOString().split('T')[0],
            meal_type: 'snack',
            custom_food_name: 'Test Apple',
            amount_g: 150,
            kcal: 75
        });
        assert(!nutErr, "Can insert Nutrition Log");

        await supabase.from('nutrition_logs').delete().eq('custom_food_name', 'Test Apple');

        // 6. V2 Features: Coaching Appointments
        console.log("\\n--- 6. Testing V2 Features (Appointments) ---");
        const { error: apptErr } = await supabase.from('coaching_appointments').insert({
            client1_id: athleteId,
            date: '2026-12-31',
            time: '14:00',
            type: 'singola'
        });
        assert(!apptErr, "Can schedule Coaching Appointment");
        await supabase.from('coaching_appointments').delete().eq('date', '2026-12-31');

        console.log("\\n=== INTEGRATION TEST SUMMARY ===");
        console.log(`Total tests: ${passed + failed}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);

        fs.writeFileSync('integration-results.json', JSON.stringify({ passed, failed, total: passed + failed }, null, 2));

    } catch (e) {
        console.error("CRITICAL TEST FAILURE:", e);
    }
}

runE2E();
