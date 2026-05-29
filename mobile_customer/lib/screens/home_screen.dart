import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'order_food_screen.dart';
import 'my_orders_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  String _userName = "Pelanggan";

  int _activeOrdersCount = 0;
  bool _isLoadingOrders = true;

  @override
  void initState() {
    super.initState();
    _loadUser();
    _fetchActiveOrders();
  }

  void _loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = prefs.getString('user_name') ?? "Pelanggan";
    });
  }

  void _fetchActiveOrders() async {
    try {
      final orders = await ApiService.getMyOrders();
      int count = 0;
      Set<String> uniqueOrderCodes = {};
      
      for (var order in orders) {
        final status = (order['status'] ?? '').toLowerCase();
        final code = order['order_code']?.toString() ?? '';
        if (status != 'selesai' && status != 'cancelled' && !uniqueOrderCodes.contains(code)) {
          uniqueOrderCodes.add(code);
          count++;
        }
      }
      
      if (mounted) {
        setState(() {
          _activeOrdersCount = count;
          _isLoadingOrders = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingOrders = false;
        });
      }
    }
  }

  void _logout() async {
    await ApiService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  Widget _buildHomeTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF10B981)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withOpacity(0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    "Spesial Hari Ini 🎉",
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  "Pesan Katering\nSekarang!",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    height: 1.1,
                    letterSpacing: -0.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _currentIndex = 1;
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF059669),
                    elevation: 10,
                    shadowColor: Colors.black12,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text("Lihat Menu", style: TextStyle(fontWeight: FontWeight.bold)),
                )
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text("Status Pesanan", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.5)),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: () {
              setState(() {
                _currentIndex = 2; // Pindah ke menu Pesanan Saya
              });
            },
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF1F5F9), width: 1.5),
                boxShadow: const [
                  BoxShadow(color: Color(0x07000000), blurRadius: 10, offset: Offset(0, 4))
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _activeOrdersCount > 0 ? Colors.blue.shade50 : Colors.grey.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.delivery_dining, color: _activeOrdersCount > 0 ? Colors.blue.shade600 : Colors.grey, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _isLoadingOrders 
                            ? const Text("Memuat status...", style: TextStyle(color: Colors.grey, fontSize: 13))
                            : Text(
                                _activeOrdersCount > 0 
                                    ? "$_activeOrdersCount Pesanan Sedang Aktif" 
                                    : "Tidak ada pesanan aktif", 
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: _activeOrdersCount > 0 ? const Color(0xFF0F172A) : Colors.grey)
                              ),
                        if (_activeOrdersCount > 0)
                          const Padding(
                            padding: EdgeInsets.only(top: 4),
                            child: Text("Ketuk untuk melacak posisi kurir", style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          )
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      _buildHomeTab(),
      const OrderFoodScreen(),
      const MyOrdersScreen(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: _currentIndex == 0 ? AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Halo, $_userName 👋",
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Text(
              "Mau makan sehat apa hari ini?",
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            onPressed: _logout,
          )
        ],
      ) : null,
      body: tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        selectedItemColor: const Color(0xFF059669),
        unselectedItemColor: const Color(0xFF94A3B8),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: "Beranda"),
          BottomNavigationBarItem(icon: Icon(Icons.restaurant_menu), label: "Pesan"),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: "Pesanan"),
        ],
      ),
    );
  }
}
