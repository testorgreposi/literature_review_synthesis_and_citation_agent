package com.bigballoon.controller;

import org.springframework.web.bind.annotation.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class WorkspaceController {
    private static final String DATA_FILE = "data.json";
    private String databaseJson = "";

    public WorkspaceController() {
        loadDatabase();
    }

    @GetMapping("/")
    public Map<String, String> getStatus() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "healthy");
        status.put("service", "BIG BALLOON Spring Boot Backend");
        status.put("version", "2.0.0");
        return status;
    }

    @PostMapping("/api/auth/signin")
    public Map<String, Object> signIn(@RequestBody Map<String, String> request) {
        String email = request.getOrDefault("email", "student@university.edu");
        String name = request.getOrDefault("name", email.split("@")[0]);
        
        Map<String, Object> user = new HashMap<>();
        user.put("email", email);
        user.put("name", name);
        user.put("isLoggedIn", true);
        return user;
    }

    @PostMapping("/api/auth/signup")
    public Map<String, Object> signUp(@RequestBody Map<String, String> request) {
        String email = request.getOrDefault("email", "student@university.edu");
        String name = request.getOrDefault("name", "Researcher");

        Map<String, Object> user = new HashMap<>();
        user.put("email", email);
        user.put("name", name);
        user.put("isLoggedIn", true);
        return user;
    }

    @GetMapping("/api/projects")
    public String getProjects() {
        return databaseJson;
    }

    @PostMapping("/api/projects/create")
    public String createProject(@RequestBody Map<String, String> request) {
        String name = request.getOrDefault("name", "New Project");
        String desc = request.getOrDefault("description", "Description");
        String deadline = request.getOrDefault("deadline", "2026-09-01");
        String id = "proj-" + System.currentTimeMillis();

        int insertPos = databaseJson.lastIndexOf("]");
        if (insertPos != -1) {
            String newProjStr = ",{"
                + "\"id\": \"" + id + "\","
                + "\"name\": \"" + name + "\","
                + "\"description\": \"" + desc + "\","
                + "\"deadline\": \"" + deadline + "\","
                + "\"papers\": [],"
                + "\"uploadedPDFs\": [],"
                + "\"activeDocument\": {"
                + "  \"id\": \"doc-" + id + "\","
                + "  \"title\": \"" + name + " Draft\","
                + "  \"content\": \"# " + name + "\\n\\nWrite literature review here.\","
                + "  \"lastSaved\": \"12:00 PM\""
                + "},"
                + "\"themes\": [],"
                + "\"matrixRows\": []"
                + "}";
            databaseJson = databaseJson.substring(0, insertPos) + newProjStr + databaseJson.substring(insertPos);
            saveDatabase();
        }
        return databaseJson;
    }

    @PostMapping("/api/projects/delete")
    public String deleteProject(@RequestBody Map<String, String> request) {
        String id = request.getOrDefault("id", "");
        // Reset state
        loadDatabase();
        return databaseJson;
    }

    @PostMapping("/api/papers/create")
    public String createPaper(@RequestBody Map<String, Object> request) {
        String title = (String) request.getOrDefault("title", "Untitled Reference");
        String authors = (String) request.getOrDefault("authors", "Unknown Author");
        String journal = (String) request.getOrDefault("journal", "Unknown Journal");
        String year = String.valueOf(request.getOrDefault("year", "2026"));
        String activeProjId = (String) request.getOrDefault("activeProjectId", "proj-1");
        String paperId = "paper-" + System.currentTimeMillis();

        int projIdx = databaseJson.indexOf("\"id\": \"" + activeProjId + "\"");
        if (projIdx != -1) {
            int papersArrIdx = databaseJson.indexOf("\"papers\": [", projIdx);
            if (papersArrIdx != -1) {
                int insertPos = papersArrIdx + 11;
                String separator = databaseJson.charAt(insertPos) == ']' ? "" : ",";
                String newPaperStr = "{"
                    + "\"id\": \"" + paperId + "\","
                    + "\"title\": \"" + title + "\","
                    + "\"authors\": \"" + authors + "\","
                    + "\"year\": " + year + ","
                    + "\"journal\": \"" + journal + "\","
                    + "\"tags\": [\"Manual\"],"
                    + "\"abstract\": \"\","
                    + "\"notes\": \"\","
                    + "\"citations\": []"
                    + "}" + separator;
                databaseJson = databaseJson.substring(0, insertPos) + newPaperStr + databaseJson.substring(insertPos);
                saveDatabase();
            }
        }
        return databaseJson;
    }

    @PostMapping("/api/pdf/upload")
    public String uploadPDF(@RequestParam("file") org.springframework.web.multipart.MultipartFile file,
                            @RequestParam("activeProjectId") String activeProjId) {
        String fileName = file.getOriginalFilename();
        if (fileName == null) fileName = "uploaded.pdf";
        
        long sizeBytes = file.getSize();
        String fileSize = String.format("%.2f MB", (double) sizeBytes / (1024 * 1024));
        int pages = 12; // Simulated extracted page count from PDF structure
        
        try {
            File dir = new File("uploads");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File dest = new File(dir, System.currentTimeMillis() + "_" + fileName);
            file.transferTo(dest);
        } catch (IOException e) {
            e.printStackTrace();
        }

        String pdfId = "pdf-" + System.currentTimeMillis();

        int projIdx = databaseJson.indexOf("\"id\": \"" + activeProjId + "\"");
        if (projIdx != -1) {
            int pdfsArrIdx = databaseJson.indexOf("\"uploadedPDFs\": [", projIdx);
            if (pdfsArrIdx != -1) {
                int insertPos = pdfsArrIdx + 17;
                String separator = databaseJson.charAt(insertPos) == ']' ? "" : ",";
                String newPdfStr = "{"
                    + "\"id\": \"" + pdfId + "\","
                    + "\"fileName\": \"" + fileName + "\","
                    + "\"fileSize\": \"" + fileSize + "\","
                    + "\"uploadDate\": \"2026-07-16\","
                    + "\"pages\": " + pages + ","
                    + "\"summary\": \"Scanned document summaries.\","
                    + "\"simplifiedText\": {"
                    + "  \"eli5\": \"Simplified dynamic caching representation.\","
                    + "  \"standard\": \"Undergraduate performance schedules evaluation.\","
                    + "  \"detailed\": \"1. Benchmarks memory.\\n2. Positions scheduling.\""
                    + "},"
                    + "\"sections\": ["
                    + "  {"
                    + "    \"id\": \"sec-" + pdfId + "-1\","
                    + "    \"title\": \"1. Scanned Abstract\","
                    + "    \"pageNumber\": 1,"
                    + "    \"content\": \"Presents local measurements in system scheduling algorithms.\""
                    + "  }"
                    + "]"
                    + "}" + separator;
                databaseJson = databaseJson.substring(0, insertPos) + newPdfStr + databaseJson.substring(insertPos);
                saveDatabase();
            }
        }
        return databaseJson;
    }

    @PostMapping("/api/document/update")
    public String updateDocument(@RequestBody Map<String, String> request) {
        String activeProjId = request.getOrDefault("activeProjectId", "proj-1");
        String content = request.getOrDefault("content", "");
        String title = request.getOrDefault("title", "");

        int projIdx = databaseJson.indexOf("\"id\": \"" + activeProjId + "\"");
        if (projIdx != -1) {
            int activeDocIdx = databaseJson.indexOf("\"activeDocument\": {", projIdx);
            if (activeDocIdx != -1) {
                int docEndIdx = databaseJson.indexOf("}", activeDocIdx);
                
                String replacementDoc = "\"activeDocument\": {"
                    + "\"id\": \"doc-update\","
                    + "\"title\": \"" + title + "\","
                    + "\"content\": \"" + content.replace("\n", "\\n").replace("\"", "\\\"") + "\","
                    + "\"lastSaved\": \"" + new SimpleDateFormat("hh:mm a").format(new Date()) + "\""
                    + "}";
                databaseJson = databaseJson.substring(0, activeDocIdx) + replacementDoc + databaseJson.substring(docEndIdx + 1);
                saveDatabase();
            }
        }
        return databaseJson;
    }

    @PostMapping("/api/ai/chat")
    public Map<String, Object> aiChat(@RequestBody Map<String, String> request) {
        String prompt = request.getOrDefault("prompt", "");
        
        String responseText = callGeminiApi(prompt);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", "msg-bot-" + System.currentTimeMillis());
        response.put("sender", "bot");
        response.put("text", responseText);
        response.put("timestamp", new SimpleDateFormat("hh:mm a").format(new Date()));
        return response;
    }

    private String callGeminiApi(String prompt) {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "🤖 [RESEARCH FLOW AI] Fallback: \"" + prompt + "\" received. Set GEMINI_API_KEY environment variable to use real Gemini AI!";
        }
        
        try {
            String urlString = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
            java.net.URL url = new java.net.URL(urlString);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            
            String escapedPrompt = prompt.replace("\\", "\\\\").replace("\"", "\\\"");
            String jsonInputString = "{\"contents\": [{\"parts\":[{\"text\":\"" + escapedPrompt + "\"}]}]}";
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonInputString.getBytes("utf-8");
                os.write(input, 0, input.length);
            }
            
            int code = conn.getResponseCode();
            if (code == 200) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "utf-8"))) {
                    StringBuilder response = new StringBuilder();
                    String responseLine = null;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    
                    String respStr = response.toString();
                    int textIndex = respStr.indexOf("\"text\": \"");
                    if (textIndex != -1) {
                        int start = textIndex + 9;
                        int end = respStr.indexOf("\"", start);
                        if (end != -1) {
                            String reply = respStr.substring(start, end);
                            return reply.replace("\\n", "\n").replace("\\\"", "\"");
                        }
                    }
                    return "AI responded successfully, but response format could not be parsed: " + respStr;
                }
            } else {
                return "Gemini API error code: " + code;
            }
        } catch (Exception e) {
            return "Failed to connect to Gemini API: " + e.getMessage();
        }
    }

    @PostMapping("/api/papers/notes")
    public String updatePaperNotes(@RequestBody Map<String, String> request) {
        String paperId = request.getOrDefault("paperId", "");
        String notes = request.getOrDefault("notes", "");
        
        int paperIdx = databaseJson.indexOf("\"id\": \"" + paperId + "\"");
        if (paperIdx != -1) {
            int notesIdx = databaseJson.indexOf("\"notes\":", paperIdx);
            if (notesIdx != -1) {
                int startQuote = databaseJson.indexOf("\"", notesIdx + 7);
                int endQuote = databaseJson.indexOf("\"", startQuote + 1);
                
                String replacementNotes = "\"" + notes.replace("\n", "\\n").replace("\"", "\\\"") + "\"";
                databaseJson = databaseJson.substring(0, startQuote) + replacementNotes + databaseJson.substring(endQuote + 1);
                saveDatabase();
            }
        }
        return databaseJson;
    }

    private void loadDatabase() {
        File file = new File(DATA_FILE);
        if (!file.exists()) {
            databaseJson = "{"
                + "\"projects\": ["
                + "  {"
                + "    \"id\": \"proj-1\","
                + "    \"name\": \"Modern Research Workflows\","
                + "    \"description\": \"Literature review exploring systematic mapping and AI ethics.\","
                + "    \"deadline\": \"2026-08-24\","
                + "    \"papers\": ["
                + "      {"
                + "        \"id\": \"paper-1\","
                + "        \"title\": \"Guidelines for Systematic Literature Reviews\","
                + "        \"authors\": \"Barbara Kitchenham\","
                + "        \"year\": 2007,"
                + "        \"journal\": \"Technical Report\","
                + "        \"tags\": [\"Methodology\", \"SLR\"],"
                + "        \"abstract\": \"Systematic guidelines adaptation.\","
                + "        \"notes\": \"Kitchenham standard SLR protocol.\","
                + "        \"citations\": []"
                + "      }"
                + "    ],"
                + "    \"uploadedPDFs\": ["
                + "      {"
                + "        \"id\": \"pdf-1\","
                + "        \"fileName\": \"attention_is_all_you_need.pdf\","
                + "        \"fileSize\": \"2.1 MB\","
                + "        \"uploadDate\": \"2026-07-10\","
                + "        \"pages\": 3,"
                + "        \"summary\": \"Transformer architecture introduction.\","
                + "        \"simplifiedText\": {"
                + "          \"eli5\": \"Fast eyes noticing important words.\","
                + "          \"standard\": \"Parallel processing using self-attention.\","
                + "          \"detailed\": \"Multi-head attention mechanism details.\""
                + "        },"
                + "        \"sections\": ["
                + "          {"
                + "            \"id\": \"sec-1\","
                + "            \"title\": \"1. Abstract & Introduction\","
                + "            \"pageNumber\": 1,"
                + "            \"content\": \"We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.\""
                + "          }"
                + "        ]"
                + "      }"
                + "    ],"
                + "    \"activeDocument\": {"
                + "      \"id\": \"doc-1\","
                + "      \"title\": \"Literature Review: Modern Research Workflows\","
                + "      \"content\": \"# Literature Review\\n\\nProtocols adaptation [cite:paper-1] standard SLR guidelines.\","
                + "      \"lastSaved\": \"12:00 PM\""
                + "    },"
                + "    \"themes\": [],"
                + "    \"matrixRows\": []"
                + "  }"
                + "]"
                + "}";
            saveDatabase();
        } else {
            try {
                BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();
                databaseJson = sb.toString();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private synchronized void saveDatabase() {
        try {
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(DATA_FILE), StandardCharsets.UTF_8));
            writer.write(databaseJson);
            writer.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
