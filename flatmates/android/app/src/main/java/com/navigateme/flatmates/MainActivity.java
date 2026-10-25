package com.navigateme.flatmates;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

/**
 * Hosts the Flatmates web app (bundled in assets) in a WebView.
 * Pages are served from https://appassets.androidplatform.net so storage and
 * network calls behave like a normal https site.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/index.html";
    private static final int PICK_PHOTOS = 1;

    private WebView web;
    private ValueCallback<Uri[]> pendingPick;

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

        if (saved != null) web.restoreState(saved);
        else web.loadUrl(START_URL);
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
