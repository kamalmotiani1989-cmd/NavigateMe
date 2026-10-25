package com.navigateme.flatmates;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.util.Collections;

/**
 * Hosts the FindMyFlatMate web app (bundled in assets) in a WebView.
 * Pages are served from https://appassets.androidplatform.net so storage and
 * network calls behave like a normal https site.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int PICK_PHOTOS = 1;
    private static final int ASK_NOTIFICATIONS = 2;
    static final String EXTRA_OPEN = "open";

    private WebView web;
    private ValueCallback<Uri[]> pendingPick;
    private JavaScriptReplyProxy page;   // lets native code message the web app

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);

        FrameLayout root = new FrameLayout(this);
        web = new WebView(this);
        root.addView(web);
        setContentView(root);
        keepClearOfSystemBars(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return assets.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri url = req.getUrl();
                if (HOST.equals(url.getHost())) return false;   // our own pages
                openOutside(url);                                // tel:, WhatsApp, Maps, Razorpay pages...
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (pendingPick != null) pendingPick.onReceiveValue(null);
                pendingPick = callback;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT)
                        .addCategory(Intent.CATEGORY_OPENABLE)
                        .setType("image/*")
                        .putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
                                params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try {
                    startActivityForResult(Intent.createChooser(pick, "Add photos"), PICK_PHOTOS);
                } catch (ActivityNotFoundException e) {
                    pendingPick = null;
                    return false;
                }
                return true;
            }
        });

        addNativeBridge();
        Notifications.ensureChannel(this);
        fetchPushToken();

        String open = screenFrom(getIntent());
        if (saved != null) web.restoreState(saved);
        else web.loadUrl(START_URL + (open != null ? "#" + open : ""));
    }

    /**
     * Exposes `FlatmatesNative` to the app's own pages only (not to embedded maps).
     * Messages are JSON: {type: hello | permission | notify, ...}.
     */
    private void addNativeBridge() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        WebViewCompat.addWebMessageListener(web, "FlatmatesNative",
                Collections.singleton("https://" + HOST),
                (WebView view, WebMessageCompat message, Uri origin, boolean isMainFrame, JavaScriptReplyProxy reply) -> {
                    if (!isMainFrame || message.getData() == null) return;
                    page = reply;
                    try {
                        JSONObject m = new JSONObject(message.getData());
                        switch (m.optString("type")) {
                            case "hello":
                                sendStatus();
                                sendToken(getSharedPreferences("push", MODE_PRIVATE).getString("token", null));
                                break;
                            case "permission":
                                askNotificationPermission();
                                break;
                            case "notify":
                                Notifications.show(this, m.optString("title"), m.optString("body"), m.optString("open", "requests"));
                                break;
                        }
                    } catch (Exception ignored) {
                        // Malformed message from the page: nothing to do.
                    }
                });
    }

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, ASK_NOTIFICATIONS);
        } else {
            sendStatus();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(requestCode, permissions, results);
        if (requestCode == ASK_NOTIFICATIONS) sendStatus();
    }

    private void sendStatus() {
        post("{\"type\":\"status\",\"granted\":" + Notifications.allowed(this) + "}");
    }

    private void sendToken(String token) {
        if (token != null) post("{\"type\":\"token\",\"token\":" + JSONObject.quote(token) + "}");
    }

    private void post(String json) {
        if (page != null) page.postMessage(json);
    }

    /** Firebase push for when the app is closed; skipped quietly if Firebase isn't configured. */
    private void fetchPushToken() {
        try {
            FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token -> {
                getSharedPreferences("push", MODE_PRIVATE).edit().putString("token", token).apply();
                sendToken(token);
            });
        } catch (Exception notConfigured) {
            // No google-services.json in this build: in-app notifications still work.
        }
    }

    private static String screenFrom(Intent intent) {
        String v = intent == null ? null : intent.getStringExtra(EXTRA_OPEN);
        return v != null && v.matches("[a-z]{1,20}") ? v : null;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String open = screenFrom(intent);
        if (open != null) web.evaluateJavascript("location.hash = '" + open + "'", null);
    }

    private void openOutside(Uri url) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, url));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app found to open this link", Toast.LENGTH_SHORT).show();
        }
    }

    /** Android 15 draws apps edge to edge; pad the page so it doesn't sit under the bars. */
    private void keepClearOfSystemBars(FrameLayout root) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return;
        // Dark icons on the white bars (the theme sets this too; edge to edge needs it explicitly).
        int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
        getWindow().getInsetsController().setSystemBarsAppearance(light, light);
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsets.CONSUMED;
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_PHOTOS || pendingPick == null) return;
        Uri[] picked = null;
        if (resultCode == RESULT_OK && data != null) {
            ClipData many = data.getClipData();
            if (many != null) {
                picked = new Uri[many.getItemCount()];
                for (int i = 0; i < picked.length; i++) picked[i] = many.getItemAt(i).getUri();
            } else if (data.getData() != null) {
                picked = new Uri[] { data.getData() };
            }
        }
        pendingPick.onReceiveValue(picked);
        pendingPick = null;
    }

    @Override
    public void onBackPressed() {
        // Screens are #hash routes, so the back button walks back through them.
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }
}
