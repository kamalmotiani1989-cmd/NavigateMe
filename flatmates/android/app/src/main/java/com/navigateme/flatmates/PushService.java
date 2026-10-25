package com.navigateme.flatmates;

import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * Receives pushes sent by the fm-notify Supabase function while the app is closed.
 * Only active once a google-services.json is added (see README).
 */
public class PushService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage msg) {
        Map<String, String> d = msg.getData();
        String title = d.get("title"), body = d.get("body");
        if (title == null && msg.getNotification() != null) {
            title = msg.getNotification().getTitle();
            body = msg.getNotification().getBody();
        }
        if (title != null) Notifications.show(this, title, body == null ? "" : body, d.get("open"));
    }

    @Override
    public void onNewToken(@NonNull String token) {
        getSharedPreferences("push", MODE_PRIVATE).edit().putString("token", token).apply();
    }
}
