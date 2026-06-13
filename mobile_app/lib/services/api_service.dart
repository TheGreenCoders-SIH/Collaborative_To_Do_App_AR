import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String defaultLocalUrl = 'http://10.0.2.2:5000';
  static const String defaultProdUrl = 'https://collaborative-to-do-app.vercel.app';
  
  static String? _cachedBaseUrl;

  static Future<String> getBaseUrl() async {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;
    final prefs = await SharedPreferences.getInstance();
    // Default to production URL
    _cachedBaseUrl = prefs.getString('api_base_url') ?? defaultProdUrl;
    return _cachedBaseUrl!;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
    _cachedBaseUrl = url;
  }

  // Token management
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> saveTokens(String token, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('refreshToken', refreshToken);
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('refreshToken');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
    await prefs.remove('user_uid');
    await prefs.remove('user_avatar');
    await prefs.remove('public_key');
    await prefs.remove('secretKey');
  }

  // Helper headers
  static Future<Map<String, String>> _getHeaders({bool requireAuth = true}) async {
    final Map<String, String> headers = {
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (requireAuth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // --- AUTH ENDPOINTS ---
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: await _getHeaders(requireAuth: false),
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      await saveTokens(data['token'], data['refreshToken']);
      final prefs = await SharedPreferences.getInstance();
      final user = data['user'];
      await prefs.setInt('user_id', user['id']);
      await prefs.setString('user_email', user['email']);
      await prefs.setString('user_name', user['name']);
      await prefs.setString('user_uid', user['user_id'] ?? '');
      await prefs.setString('user_avatar', user['avatar_url'] ?? '');
      await prefs.setString('public_key', user['public_key'] ?? '');
      if (user['secret_key'] != null) {
        await prefs.setString('secretKey', user['secret_key']);
      }
      return {'success': true, 'user': user};
    } else {
      return {'success': false, 'error': data['error'] ?? 'Login failed'};
    }
  }

  static Future<Map<String, dynamic>> register(String email, String name, String password) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: await _getHeaders(requireAuth: false),
      body: jsonEncode({'email': email, 'name': name, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      await saveTokens(data['token'], data['refreshToken']);
      final prefs = await SharedPreferences.getInstance();
      final user = data['user'];
      await prefs.setInt('user_id', user['id']);
      await prefs.setString('user_email', user['email']);
      await prefs.setString('user_name', user['name']);
      await prefs.setString('user_uid', user['user_id'] ?? '');
      await prefs.setString('user_avatar', user['avatar_url'] ?? '');
      await prefs.setString('public_key', user['public_key'] ?? '');
      if (user['secret_key'] != null) {
        await prefs.setString('secretKey', user['secret_key']);
      }
      return {'success': true, 'user': user};
    } else {
      return {'success': false, 'error': data['error'] ?? 'Registration failed'};
    }
  }

  // --- TEAMS ENDPOINTS ---
  static Future<List<dynamic>> fetchTeams() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/teams'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<Map<String, dynamic>> createTeam(String name, String description) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/teams'),
      headers: await _getHeaders(),
      body: jsonEncode({'name': name, 'description': description}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> addTeamMember(int teamId, String email) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/teams/$teamId/members'),
      headers: await _getHeaders(),
      body: jsonEncode({'email': email}),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 201 || response.statusCode == 200) {
      return {'success': true, 'message': data['message'] ?? 'Member added successfully'};
    } else {
      return {'success': false, 'error': data['error'] ?? 'Failed to add member'};
    }
  }

  // --- TASKS ENDPOINTS ---
  static Future<List<dynamic>> fetchTasks(int teamId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/teams/$teamId/tasks'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<Map<String, dynamic>> createTask(int teamId, String title, String description, String status, String? deadline, List<int> assignedTo) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/teams/$teamId/tasks'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'title': title,
        'description': description,
        'status': status,
        'deadline': deadline,
        'assigned_to': assignedTo,
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> updateTaskStatus(int taskId, String status) async {
    final baseUrl = await getBaseUrl();
    final response = await http.put(
      Uri.parse('$baseUrl/api/tasks/$taskId/status'),
      headers: await _getHeaders(),
      body: jsonEncode({'status': status}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> approveTask(int taskId, bool approve, String reason) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/tasks/$taskId/approve'),
      headers: await _getHeaders(),
      body: jsonEncode({'approve': approve, 'reason': reason}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> deleteTask(int taskId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.delete(
      Uri.parse('$baseUrl/api/tasks/$taskId'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      try {
        return jsonDecode(response.body);
      } catch (_) {
        return {'success': false, 'error': 'Failed to delete task'};
      }
    }
  }

  // --- COMMENTS ENDPOINTS ---
  static Future<List<dynamic>> fetchComments(int taskId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/tasks/$taskId/comments'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<Map<String, dynamic>> addComment(int taskId, String content) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/tasks/$taskId/comments'),
      headers: await _getHeaders(),
      body: jsonEncode({'content': content}),
    );
    return jsonDecode(response.body);
  }

  // --- FRIENDS ENDPOINTS ---
  static Future<List<dynamic>> fetchFriends() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/friends'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['friends'] ?? [];
    }
    return [];
  }

  static Future<List<dynamic>> fetchPendingFriends() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/friends/pending'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['requests'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> sendFriendRequest(int addresseeId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/friends/request'),
      headers: await _getHeaders(),
      body: jsonEncode({'addressee_id': addresseeId}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> respondToFriendRequest(int friendshipId, String action) async {
    final baseUrl = await getBaseUrl();
    final response = await http.put(
      Uri.parse('$baseUrl/api/friends/respond'),
      headers: await _getHeaders(),
      body: jsonEncode({'friendship_id': friendshipId, 'action': action}),
    );
    return jsonDecode(response.body);
  }

  // --- MESSAGING ENDPOINTS ---
  static Future<List<dynamic>> fetchConversations() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/messages/conversations'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['conversations'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> createConversation(int userId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/messages/conversations'),
      headers: await _getHeaders(),
      body: jsonEncode({'user_id_2': userId}),
    );
    return jsonDecode(response.body);
  }

  static Future<List<dynamic>> fetchMessages(int conversationId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/messages/conversations/$conversationId/messages?limit=100'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['messages'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> sendMessage(int conversationId, String encryptedContent, String nonce) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/messages/messages'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'conversation_id': conversationId,
        'encrypted_content': encryptedContent,
        'nonce': nonce,
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<void> markMessageRead(int messageId) async {
    final baseUrl = await getBaseUrl();
    await http.post(
      Uri.parse('$baseUrl/api/messages/messages/$messageId/read'),
      headers: await _getHeaders(),
    );
  }

  static Future<List<dynamic>> fetchTeamMessages(int teamId) async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/messages/team/$teamId?limit=100'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['messages'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> sendTeamMessage(int teamId, String content) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/messages/team/$teamId'),
      headers: await _getHeaders(),
      body: jsonEncode({'content': content}),
    );
    return jsonDecode(response.body);
  }

  // --- NOTIFICATIONS ENDPOINTS ---
  static Future<List<dynamic>> fetchNotifications() async {
    final baseUrl = await getBaseUrl();
    final response = await http.get(
      Uri.parse('$baseUrl/api/notifications'),
      headers: await _getHeaders(),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['notifications'] ?? [];
    }
    return [];
  }

  static Future<Map<String, dynamic>> markNotificationRead(int id) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/notifications/$id/read'),
      headers: await _getHeaders(),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> markAllNotificationsRead() async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/api/notifications/read-all'),
      headers: await _getHeaders(),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> deleteNotification(int id) async {
    final baseUrl = await getBaseUrl();
    final response = await http.delete(
      Uri.parse('$baseUrl/api/notifications/$id'),
      headers: await _getHeaders(),
    );
    return jsonDecode(response.body);
  }
}
