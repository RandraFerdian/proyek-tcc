import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/api_service.dart';
import 'chat_screen.dart';
import 'courier_tracking_screen.dart';
class OrderDetailScreen extends StatefulWidget {
  final Map<String, dynamic> order;

  const OrderDetailScreen({Key? key, required this.order}) : super(key: key);

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late Map<String, dynamic> _order;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _order = widget.order;
    _setActiveOrder();
  }

  Future<void> _setActiveOrder() async {
    final prefs = await SharedPreferences.getInstance();
    final status = _order['status'].toString().toLowerCase();
    if (status != 'selesai' && status != 'delivered') {
      await prefs.setInt('active_order_id', _order['id']);
    } else {
      await prefs.remove('active_order_id');
    }
  }

  void _openTrackingMap() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CourierTrackingScreen(order: _order),
      ),
    );
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isLoading = true);
    try {
      await ApiService.updateOrderStatus(_order['id'], newStatus);
      setState(() {
        _order['status'] = newStatus;
      });
      _setActiveOrder();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Status diperbarui')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))));
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildStatusAction() {
    final status = _order['status'].toString().toLowerCase();
    
    if (['pending', 'diproses'].contains(status)) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: _isLoading ? null : () => _updateStatus('Dikirim'),
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2f6f4e), foregroundColor: Colors.white),
          child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Mulai Pengiriman', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
    } else if (['dikirim', 'in_transit'].contains(status)) {
      return SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton(
          onPressed: _isLoading ? null : () => _updateStatus('Selesai'),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
          child: _isLoading ? const CircularProgressIndicator(color: Colors.white) : const Text('Tandai Selesai', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      );
    }
    return const Center(child: Text('Pesanan telah selesai', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Detail Pesanan', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.chat),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(orderCode: _order['order_code'])));
            },
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('#${_order['order_code']}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Pelanggan: ${_order['customer']?['name'] ?? '-'}', style: const TextStyle(color: Colors.grey)),
                    const Divider(height: 32),
                    
                    InkWell(
                      onTap: _openTrackingMap,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        height: 120,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFbbf7d0)),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.map, size: 40, color: Color(0xFF16a34a)),
                            SizedBox(height: 8),
                            Text('Buka Peta Navigasi', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF16a34a))),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    
                    const Text('Alamat Tujuan:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(_order['address']?['street'] ?? 'Tidak tersedia', style: const TextStyle(color: Colors.grey)),
                    const SizedBox(height: 16),
                    
                    const Text('Menu:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('${_order['package']?['name'] ?? '-'} (x${_order['quantity']})', style: const TextStyle(color: Colors.grey)),
                    const SizedBox(height: 16),
                    
                    const Text('Catatan:', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(_order['notes'] ?? '-', style: const TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            _buildStatusAction(),
          ],
        ),
      ),
    );
  }
}
