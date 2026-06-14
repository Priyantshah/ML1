import supabase from "../db/index.js";

/**
 * Logs a system activity/event to Supabase for historical tracking.
 * @param {string} type - Event type (login, dataset_upload, model_trained, session_heartbeat)
 * @param {string} userEmail - User associated with the event
 * @param {object} details - Additional metadata
 */
export const logActivity = async (type, userEmail, details = {}) => {
    try {
        const { error } = await supabase.from("activity_logs").insert([
            {
                event_type: type,
                user_email: userEmail,
                details: JSON.stringify(details),
                created_at: new Date().toISOString()
            }
        ]);
        if (error) {
            // Table might not exist yet, we'll try to handle it silently in prod but log in dev
            if (error.code === '42P01') { // Undefined table
                console.warn("Table 'activity_logs' does not exist. Please create it in Supabase.");
            } else {
                console.error("Error logging activity:", error.message);
            }
        }
    } catch (err) {
        console.error("Activity logging failed:", err);
    }
};
