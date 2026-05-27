import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  bool _isLoading = false;
  
  int? _id;
  String? _name;
  String? _email;
  String? _userId;
  String? _avatarUrl;
  String? _publicKey;
  String? _secretKey;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  
  int? get id => _id;
  String? get name => _name;
  String? get email => _email;
  String? get userId => _userId;
  String? get avatarUrl => _avatarUrl;
  String? get publicKey => _publicKey;
  String? get secretKey => _secretKey;

  AuthProvider() {
    checkAuth();
  }

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await ApiService.getToken();
      if (token != null) {
        final prefs = await SharedPreferences.getInstance();
        _id = prefs.getInt('user_id');
        _email = prefs.getString('user_email');
        _name = prefs.getString('user_name');
        _userId = prefs.getString('user_uid');
        _avatarUrl = prefs.getString('user_avatar');
        _publicKey = prefs.getString('public_key');
        _secretKey = prefs.getString('secretKey');
        
        _isAuthenticated = _id != null;
      } else {
        _isAuthenticated = false;
      }
    } catch (e) {
      _isAuthenticated = false;
      print('Check auth error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.login(email, password);
      if (result['success'] == true) {
        final user = result['user'];
        _id = user['id'];
        _email = user['email'];
        _name = user['name'];
        _userId = user['user_id'];
        _avatarUrl = user['avatar_url'];
        _publicKey = user['public_key'];
        
        final prefs = await SharedPreferences.getInstance();
        _secretKey = prefs.getString('secretKey'); // restored in login API call internally

        _isAuthenticated = true;
        return {'success': true};
      } else {
        return {'success': false, 'error': result['error']};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> register(String email, String name, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.register(email, name, password);
      if (result['success'] == true) {
        final user = result['user'];
        _id = user['id'];
        _email = user['email'];
        _name = user['name'];
        _userId = user['user_id'];
        _avatarUrl = user['avatar_url'];
        _publicKey = user['public_key'];
        
        final prefs = await SharedPreferences.getInstance();
        _secretKey = prefs.getString('secretKey'); // restored in register API call internally

        _isAuthenticated = true;
        return {'success': true};
      } else {
        return {'success': false, 'error': result['error']};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await ApiService.clearSession();
    _isAuthenticated = false;
    _id = null;
    _name = null;
    _email = null;
    _userId = null;
    _avatarUrl = null;
    _publicKey = null;
    _secretKey = null;

    _isLoading = false;
    notifyListeners();
  }
}
