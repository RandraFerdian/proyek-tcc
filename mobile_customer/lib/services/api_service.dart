import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiService {
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api/v1';

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> loginCustomer(String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/customer/login');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      final token = data['token'] ?? data['access_token'];
      
      if (token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        await prefs.setString('user_role', data['role'] ?? 'user');
        if (data['user_id'] != null) {
          await prefs.setInt('user_id', data['user_id']);
        }
        await prefs.setString('user_name', data['name'] ?? 'Pelanggan');
      }
      return data;
    } else {
      String errorMessage = 'Email atau password salah.';
      try {
        final data = jsonDecode(response.body);
        if (data['detail'] != null) {
          errorMessage = data['detail'];
        }
      } catch (e) {}
      throw Exception(errorMessage);
    }
  }

  static Future<Map<String, dynamic>> registerCustomer(String name, String? company, String phone, String email, String password) async {
    final url = Uri.parse('$baseUrl/auth/customer/register');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'company': company,
        'phone': phone,
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      String errorMessage = 'Gagal mendaftar.';
      try {
        final data = jsonDecode(response.body);
        if (data['detail'] != null) {
          errorMessage = data['detail'];
        }
      } catch (e) {}
      throw Exception(errorMessage);
    }
  }

  static Future<List<dynamic>> getPackages() async {
    final url = Uri.parse('$baseUrl/packages/');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Gagal memuat paket');
    }
  }

  static Future<List<dynamic>> getMyOrders() async {
    final url = Uri.parse('$baseUrl/orders/me');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Gagal memuat pesanan');
    }
  }

  static Future<Map<String, dynamic>> getOrderById(String id) async {
    // If id is ORD-XXX, extract the number. If it's already a number, use it.
    final numericId = id.replaceAll(RegExp(r'[^0-9]'), '');
    if (numericId.isEmpty) throw Exception("ID tidak valid");
    
    final url = Uri.parse('$baseUrl/orders/$numericId');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Gagal memuat detail pesanan');
    }
  }

  static Future<List<dynamic>> getChatMessages(String orderCode) async {
    final url = Uri.parse('$baseUrl/chat/$orderCode');
    final response = await http.get(url, headers: await _getHeaders());
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    return [];
  }

  static Future<void> sendChatMessage(Map<String, dynamic> messageData) async {
    final url = Uri.parse('$baseUrl/chat/');
    await http.post(
      url,
      headers: await _getHeaders(),
      body: jsonEncode(messageData),
    );
  }

  static Future<Map<String, dynamic>> createAddress(Map<String, dynamic> data) async {
    final url = Uri.parse('$baseUrl/addresses/');
    final response = await http.post(url, headers: await _getHeaders(), body: jsonEncode(data));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    throw Exception('Gagal menyimpan alamat pengiriman');
  }

  static Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final url = Uri.parse('$baseUrl/orders/');
    final response = await http.post(url, headers: await _getHeaders(), body: jsonEncode(data));
    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    }
    throw Exception('Gagal membuat pesanan');
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
