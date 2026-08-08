import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final fbService = Provider.of<FirebaseService>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('NOTIFICATIONS'),
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: fbService.notificationsStream(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Stream Error: ${snapshot.error}'));
          }
          final list = snapshot.data ?? [];
          if (list.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none_outlined, size: 64, color: Color(0xFF1E293B)),
                  SizedBox(height: 16),
                  Text('No notifications recorded.', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final notif = list[index];
              final title = notif['title'] as String? ?? 'Notification';
              final message = notif['message'] as String? ?? '';
              final type = notif['type'] as String? ?? 'general';
              
              DateTime date = DateTime.now();
              final timestamp = notif['timestamp'];
              if (timestamp != null) {
                if (timestamp is double || timestamp is int) {
                  date = DateTime.fromMillisecondsSinceEpoch((timestamp * 1000).toInt());
                } else if (timestamp is Map && timestamp['_seconds'] != null) {
                  date = DateTime.fromMillisecondsSinceEpoch((timestamp['_seconds'] * 1000).toInt());
                } else {
                  try {
                    date = DateTime.parse(timestamp.toString());
                  } catch (_) {}
                }
              }

              final orderId = notif['orderId'] as String?;

              IconData icon = Icons.info_outline;
              Color color = Colors.white;
              if (type == 'low_stock') {
                icon = Icons.warning_amber_outlined;
                color = const Color(0xFF737373);
              } else if (type == 'new_order') {
                icon = Icons.shopping_cart_outlined;
                color = const Color(0xFFD4D4D4);
              } else if (type == 'invoice_sent') {
                icon = Icons.receipt_long_outlined;
                color = Colors.white;
              }

              return Card(
                color: const Color(0xFF171717),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: color.withOpacity(0.1),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  title: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          message,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                        if (type == 'invoice_sent' && orderId != null) ...[
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Icon(Icons.picture_as_pdf, color: color, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'Tap to View Invoice PDF',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: color,
                                ),
                              ),
                            ],
                          ),
                        ]
                      ],
                    ),
                  ),
                  trailing: Text(
                    DateFormat('kk:mm').format(date),
                    style: const TextStyle(fontSize: 10, color: Color(0xFF475569)),
                  ),
                  onTap: () {
                    if (type == 'invoice_sent' && orderId != null) {
                      fbService.launchInvoiceUrl(orderId);
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}
