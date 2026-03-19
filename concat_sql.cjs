const fs = require('fs');
const path = require('path');

const filesToConcat = [
    'step3_logging_layer.sql',
    'step4_coach_nutrition.sql',
    'step5_coach_analytics.sql',
    'step6_traffic_lights.sql',
    'step7_ui_presentation.sql',
    'step8_workout_logging.sql',
    'step9_v2_features.sql',
    'step10_appointments.sql',
    'step11_final_v2_merge.sql'
];

const dir = '/Users/danielecasavecchia/Desktop/csvteam-app/supabase_migrations';
let combinedSql = '-- ============================================================\n';
combinedSql += '-- FULL COACH V2 MIGRATION SCRIPT\n';
combinedSql += '-- ============================================================\n\n';

for (const file of filesToConcat) {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
        combinedSql += fs.readFileSync(filePath, 'utf8') + '\n\n';
    } else {
        console.error(`Missing file: ${file}`);
    }
}

fs.writeFileSync(path.join(dir, 'FINAL_COACH_MIGRATION.sql'), combinedSql);
console.log('Successfully created FINAL_COACH_MIGRATION.sql');
