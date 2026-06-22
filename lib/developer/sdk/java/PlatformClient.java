package com.platform.sdk;

import java.net.http.*;
import java.net.URI;
import java.time.Duration;
import java.util.*;

public class PlatformClient {
    private final String apiKey;
    private final String baseUrl;
    private final HttpClient client;
    private final int maxRetries;

    public PlatformClient(String apiKey) {
        this(apiKey, "https://api.platform.io/v1");
    }

    public PlatformClient(String apiKey, String baseUrl) {
        this.apiKey = apiKey != null ? apiKey : System.getenv().getOrDefault("PLATFORM_API_KEY", "");
        this.baseUrl = baseUrl;
        this.client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
        this.maxRetries = 3;
    }

    public String request(String method, String path, String body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(baseUrl + path))
            .header("Authorization", "Bearer " + apiKey)
            .header("Content-Type", "application/json")
            .header("User-Agent", "platform-sdk-java/4.5.0");
        if ("GET".equals(method)) builder = builder.GET();
        else if ("POST".equals(method) && body != null) builder = builder.POST(HttpRequest.BodyPublishers.ofString(body));
        else builder = builder.method(method, body != null ? HttpRequest.BodyPublishers.ofString(body) : HttpRequest.BodyPublishers.noBody());
        for (int i = 0; i <= maxRetries; i++) {
            if (i > 0) Thread.sleep((long) Math.pow(2, i) * 100);
            try {
                HttpResponse<String> response = client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() < 500) return response.body();
            } catch (Exception e) { if (i == maxRetries) throw e; }
        }
        return "{}";
    }

    public String get(String path) throws Exception { return request("GET", path, null); }
    public String post(String path, String body) throws Exception { return request("POST", path, body); }

    public String listPlugins() throws Exception { return get("/plugins"); }
    public String listIntegrations() throws Exception { return get("/integrations"); }
}
