import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ChatScreen extends StatefulWidget {
  final String orderCode;
  
  const ChatScreen({super.key, required this.orderCode});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<dynamic> _messages = [];
  bool _isLoading = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    // Polling setiap 3 detik agar terasa realtime layaknya web
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _fetchMessages(isBackground: true);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages({bool isBackground = false}) async {
    try {
      final List<dynamic> newMessages = await ApiService.getChatMessages(widget.orderCode);
      
      // Sort by created_at / timestamp
      newMessages.sort((a, b) {
        final tA = DateTime.parse(a['created_at'] ?? a['timestamp'] ?? DateTime.now().toIso8601String());
        final tB = DateTime.parse(b['created_at'] ?? b['timestamp'] ?? DateTime.now().toIso8601String());
        return tA.compareTo(tB);
      });

      if (mounted) {
        setState(() {
          _messages = newMessages;
          if (!isBackground) _isLoading = false;
        });
        
        if (!isBackground) {
          _scrollToBottom();
        }
      }
    } catch (e) {
      if (mounted && !isBackground) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final newMsg = {
      "order_code": widget.orderCode,
      "sender_role": "customer",
      "sender_name": "Pelanggan",
      "message": text,
    };

    // Optimistic UI Update
    setState(() {
      _messages.add({
        ...newMsg,
        "created_at": DateTime.now().toIso8601String(),
      });
    });
    _messageController.clear();
    _scrollToBottom();

    try {
      await ApiService.sendChatMessage(newMsg);
      // Fetch ulang untuk memastikan sinkronisasi id
      _fetchMessages(isBackground: true);
    } catch (e) {
      // ignore
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // slate-50
      appBar: AppBar(
        backgroundColor: const Color(0xFF059669), // emerald-600
        elevation: 1,
        titleSpacing: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Chat Pesanan", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            Text(widget.orderCode, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.9), fontFamily: 'monospace')),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF059669)))
                : _messages.isEmpty
                    ? const Center(
                        child: Text(
                          "Belum ada pesan. Mulai sapa kurir Anda!",
                          style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe = msg['sender_role'] == 'customer';

                          return Align(
                            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                              child: Column(
                                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      if (!isMe) ...[
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: Colors.amber.shade100,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.local_shipping, size: 12, color: Colors.deepOrange),
                                        ),
                                        const SizedBox(width: 4),
                                      ],
                                      Text(
                                        msg['sender_name'] ?? (isMe ? 'Pelanggan' : 'Kurir'),
                                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                                      ),
                                      if (isMe) ...[
                                        const SizedBox(width: 4),
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: Colors.blue.shade100,
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.person, size: 12, color: Colors.blue),
                                        ),
                                      ]
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                    decoration: BoxDecoration(
                                      color: isMe ? const Color(0xFF059669) : Colors.white,
                                      borderRadius: BorderRadius.only(
                                        topLeft: const Radius.circular(16),
                                        topRight: const Radius.circular(16),
                                        bottomLeft: Radius.circular(isMe ? 16 : 0),
                                        bottomRight: Radius.circular(isMe ? 0 : 16),
                                      ),
                                      border: isMe ? null : Border.all(color: Colors.grey.shade300),
                                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 2)],
                                    ),
                                    child: Text(
                                      msg['message'] ?? '',
                                      style: TextStyle(
                                        color: isMe ? Colors.white : const Color(0xFF334155),
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: TextField(
                      controller: _messageController,
                      decoration: const InputDecoration(
                        hintText: "Tulis pesan...",
                        border: InputBorder.none,
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: _sendMessage,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
