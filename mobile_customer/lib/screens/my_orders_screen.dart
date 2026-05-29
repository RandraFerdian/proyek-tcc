import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'customer_tracking_screen.dart';

class MyOrdersScreen extends StatefulWidget {
  const MyOrdersScreen({super.key});

  @override
  State<MyOrdersScreen> createState() => _MyOrdersScreenState();
}

class _MyOrdersScreenState extends State<MyOrdersScreen> {
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    try {
      final rawOrders = await ApiService.getMyOrders();
      
      // Group orders by order_code
      Map<String, dynamic> grouped = {};
      for (var order in rawOrders) {
        String code = order['order_code']?.toString() ?? 'Unknown';
        if (!grouped.containsKey(code)) {
          grouped[code] = {
            'order_code': code,
            'id': order['id'], // Gunakan ID pertama untuk tracking
            'status': order['status'],
            'lat': order['lat'],
            'lng': order['lng'],
            'items': [],
          };
        }
        
        final packageName = order['package'] != null ? order['package']['name'] : 'Paket Makanan';
        grouped[code]['items'].add({
          'quantity': order['quantity'] ?? 1,
          'package': packageName,
        });
      }

      setState(() {
        _orders = grouped.values.toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _getBadgeColor(String status) {
    switch(status.toLowerCase()) {
      case 'selesai': return Colors.green;
      case 'pending': return Colors.orange;
      case 'dikirim': 
      case 'in transit': return Colors.blue;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text("Pesanan Saya", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 1,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF0F172A)))
          : _error != null
              ? Center(child: Text("Gagal memuat pesanan: $_error", style: const TextStyle(color: Colors.red)))
              : _orders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.receipt_long, size: 80, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          const Text("Belum ada pesanan aktif", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          const SizedBox(height: 8),
                          const Text("Ayo mulai pesan katering pertamamu!", style: TextStyle(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _orders.length,
                      itemBuilder: (context, index) {
                        final order = _orders[index];
                        final items = order['items'] as List;
                        final statusStr = (order['status'] ?? 'pending').toString();
                        final badgeColor = _getBadgeColor(statusStr);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
                            boxShadow: const [
                              BoxShadow(color: Color(0x0A000000), blurRadius: 12, offset: Offset(0, 6))
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text("Kode Pesanan", style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                                          Text(
                                            "${order['order_code']}", 
                                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: badgeColor.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(statusStr.toUpperCase(), style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                    )
                                  ],
                                ),
                                const Divider(height: 24),
                                
                                // Loop semua menu yang ada di dalam 1 order_code
                                ...items.map((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 6),
                                  child: Text("${item['quantity']}x ${item['package']}", style: const TextStyle(color: Colors.black87)),
                                )),
                                
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => CustomerTrackingScreen(
                                            orderId: order['id'].toString(),
                                            lat: order['lat'] != null ? double.tryParse(order['lat'].toString()) : null,
                                            lng: order['lng'] != null ? double.tryParse(order['lng'].toString()) : null,
                                          ),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.map),
                                    label: Text(
                                      (order['status'] ?? '').toLowerCase() == 'selesai' 
                                        ? "Lihat Detail Pengiriman" 
                                        : "Lacak Pesanan di Peta"
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF059669), // Emerald
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                        );
                      },
                    ),
    );
  }
}
