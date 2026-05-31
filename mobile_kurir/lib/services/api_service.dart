import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiService {
  static String get baseUrl => dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api/v1';

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('courier_token');
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    if (token != null) {
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };
    }
    return {'Content-Type': 'application/json'};
  }

  static Future<Map<String, dynamic>> login(
      String phone, String vehiclePlate) async {
    final response = await http.post(
      Uri.parse('$baseUrl/couriers/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'phone': phone,
        'vehicle_plate': vehiclePlate,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['detail'] ?? 'Gagal login');
    }
  }

  static Future<List<dynamic>> getOrders(int courierId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/orders/courier/$courierId'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    } else {
      throw Exception('Gagal memuat tugas');
    }
  }

  static Future<Map<String, dynamic>> assignOrder(
      int orderId, int courierId) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$orderId/assign-courier'),
      headers: headers,
      body: json.encode({'courier_id': courierId}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['detail'] ?? 'Gagal mengambil tugas');
    }
  }

  static Future<Map<String, dynamic>> updateOrderStatus(
      int orderId, String status) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$orderId/status'),
      headers: headers,
      body: json.encode({'status': status}),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['detail'] ?? 'Gagal update status');
    }
  }

  static Future<void> updateLocation(
      int courierId, double lat, double lng, int? orderId) async {
    final headers = await _getHeaders();
    await http.post(
      Uri.parse('$baseUrl/couriers/$courierId/location'),
      headers: headers,
      body: json.encode({
        'lat': lat,
        'lng': lng,
        if (orderId != null) 'order_id': orderId,
      }),
    );
  }

  static Future<List<dynamic>> getChat(String orderCode) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/chat/$orderCode'),
      headers: headers,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    } else {
      throw Exception('Gagal memuat chat');
    }
  }

  static Future<void> sendChat(
      String orderCode, String message, String senderName) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/chat/'),
      headers: headers,
      body: json.encode({
        'order_code': orderCode,
        'sender_role': 'courier',
        'sender_name': senderName,
        'message': message,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Gagal mengirim pesan');
    }
  }
}
