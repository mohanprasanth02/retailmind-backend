import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';
import 'package:intl/intl.dart';
import 'dart:math' as math;

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _shimmerController;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'processing':
        return const Color(0xFF60A5FA);
      case 'completed':
        return const Color(0xFF34D399);
      case 'rejected':
      case 'cancelled':
        return const Color(0xFFF87171);
      default:
        return const Color(0xFF9CA3AF);
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Icons.hourglass_empty_rounded;
      case 'processing':
        return Icons.autorenew_rounded;
      case 'completed':
        return Icons.check_circle_rounded;
      case 'rejected':
      case 'cancelled':
        return Icons.cancel_rounded;
      default:
        return Icons.help_outline_rounded;
    }
  }

  IconData _getPlatformIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'whatsapp':
        return Icons.chat_rounded;
      case 'instagram':
        return Icons.camera_alt_rounded;
      case 'email':
        return Icons.mail_rounded;
      case 'website':
        return Icons.language_rounded;
      default:
        return Icons.store_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final fbService = Provider.of<FirebaseService>(context, listen: false);

    return Scaffold(
      backgroundColor: const Color(0xFF080808),
      body: CustomScrollView(
        slivers: [
          // ── Premium SliverAppBar ──────────────────────────────────────
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: const Color(0xFF080808),
            surfaceTintColor: Colors.transparent,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'ORDER HISTORY',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Track & manage all orders',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF6B7280),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF111111), Color(0xFF080808)],
                  ),
                ),
                child: Stack(
                  children: [
                    Positioned(
                      right: -30,
                      top: -30,
                      child: AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, child) => Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withOpacity(
                                0.015 + 0.01 * _pulseController.value),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Filter Chips ─────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              height: 48,
              margin: const EdgeInsets.only(top: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _FilterChip(
                    label: 'All',
                    selected: _filterStatus == 'all',
                    onTap: () => setState(() => _filterStatus = 'all'),
                  ),
                  _FilterChip(
                    label: 'Pending',
                    selected: _filterStatus == 'pending',
                    color: const Color(0xFFF59E0B),
                    onTap: () => setState(() => _filterStatus = 'pending'),
                  ),
                  _FilterChip(
                    label: 'Processing',
                    selected: _filterStatus == 'processing',
                    color: const Color(0xFF60A5FA),
                    onTap: () => setState(() => _filterStatus = 'processing'),
                  ),
                  _FilterChip(
                    label: 'Completed',
                    selected: _filterStatus == 'completed',
                    color: const Color(0xFF34D399),
                    onTap: () => setState(() => _filterStatus = 'completed'),
                  ),
                  _FilterChip(
                    label: 'Cancelled',
                    selected: _filterStatus == 'cancelled',
                    color: const Color(0xFFF87171),
                    onTap: () => setState(() => _filterStatus = 'cancelled'),
                  ),
                ],
              ),
            ),
          ),

          // ── Orders Stream ─────────────────────────────────────────────
          StreamBuilder<List<Map<String, dynamic>>>(
            stream: fbService.ordersStream(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return SliverFillRemaining(
                  child: _buildLoadingState(),
                );
              }
              if (snapshot.hasError) {
                return SliverFillRemaining(
                  child: _buildErrorState(snapshot.error.toString()),
                );
              }

              var ordersList = snapshot.data ?? [];

              // Apply filter
              if (_filterStatus != 'all') {
                ordersList = ordersList.where((o) {
                  final s = (o['status'] as String? ?? '').toLowerCase();
                  return s == _filterStatus;
                }).toList();
              }

              if (ordersList.isEmpty) {
                return SliverFillRemaining(
                  child: _buildEmptyState(),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final order = ordersList[index];
                      return _OrderCard(
                        order: order,
                        index: index,
                        pulseController: _pulseController,
                        shimmerController: _shimmerController,
                        getStatusColor: _getStatusColor,
                        getStatusIcon: _getStatusIcon,
                        getPlatformIcon: _getPlatformIcon,
                        fbService: fbService,
                      );
                    },
                    childCount: ordersList.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _shimmerController,
            builder: (context, child) {
              return Transform.rotate(
                angle: _shimmerController.value * 2 * math.pi,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 2,
                    ),
                    gradient: SweepGradient(
                      colors: [
                        Colors.white.withOpacity(0.0),
                        Colors.white.withOpacity(0.6),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),
          const Text(
            'LOADING ORDERS...',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              color: Color(0xFF6B7280),
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) => Transform.scale(
              scale: 0.95 + 0.05 * _pulseController.value,
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.04),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.08),
                  ),
                ),
                child: const Icon(
                  Icons.shopping_bag_outlined,
                  size: 40,
                  color: Color(0xFF374151),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'No orders found',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Color(0xFF4B5563),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Place an order from the dashboard',
            style: TextStyle(fontSize: 12, color: Color(0xFF374151)),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Color(0xFFF87171)),
          const SizedBox(height: 12),
          const Text('Connection Error',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(error,
              style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

// ── Filter Chip Widget ──────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final Color? color;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? Colors.white;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? chipColor.withOpacity(0.15) : const Color(0xFF111111),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected ? chipColor.withOpacity(0.5) : const Color(0xFF1F2937),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            color: selected ? chipColor : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }
}

// ── Premium Order Card ──────────────────────────────────────────────────────
class _OrderCard extends StatefulWidget {
  final Map<String, dynamic> order;
  final int index;
  final AnimationController pulseController;
  final AnimationController shimmerController;
  final Color Function(String) getStatusColor;
  final IconData Function(String) getStatusIcon;
  final IconData Function(String) getPlatformIcon;
  final FirebaseService fbService;

  const _OrderCard({
    required this.order,
    required this.index,
    required this.pulseController,
    required this.shimmerController,
    required this.getStatusColor,
    required this.getStatusIcon,
    required this.getPlatformIcon,
    required this.fbService,
  });

  @override
  State<_OrderCard> createState() => _OrderCardState();
}

class _OrderCardState extends State<_OrderCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _entranceController;
  late Animation<double> _slideAnim;
  late Animation<double> _fadeAnim;
  bool _expanded = false;

  @override
  void initState() {
    super.initState();
    _entranceController = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 400 + widget.index * 80),
    );
    _slideAnim = Tween<double>(begin: 40, end: 0).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOutCubic),
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOut),
    );

    // Staggered entrance
    Future.delayed(Duration(milliseconds: widget.index * 60), () {
      if (mounted) _entranceController.forward();
    });
  }

  @override
  void dispose() {
    _entranceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final orderId = order['orderId'] as String? ?? '';
    final shortId =
        orderId.length > 8 ? orderId.substring(0, 8).toUpperCase() : orderId.toUpperCase();
    final platform = order['platform'] as String? ?? 'website';
    final status = order['status'] as String? ?? 'Pending';
    final products = order['products'] as List? ?? [];
    final total = (order['total'] as num?)?.toDouble() ?? 0.0;
    final statusColor = widget.getStatusColor(status);
    final isCompleted = status.toLowerCase() == 'completed';
    final isProcessing = status.toLowerCase() == 'processing';

    DateTime date = DateTime.now();
    final timestamp = order['timestamp'];
    if (timestamp != null) {
      if (timestamp is double || timestamp is int) {
        date = DateTime.fromMillisecondsSinceEpoch((timestamp * 1000).toInt());
      } else if (timestamp is Map && timestamp['_seconds'] != null) {
        date =
            DateTime.fromMillisecondsSinceEpoch((timestamp['_seconds'] * 1000).toInt());
      } else {
        try {
          date = DateTime.parse(timestamp.toString());
        } catch (_) {}
      }
    }

    return AnimatedBuilder(
      animation: _entranceController,
      builder: (context, child) => Transform.translate(
        offset: Offset(0, _slideAnim.value),
        child: Opacity(opacity: _fadeAnim.value, child: child),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF0F0F0F),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: statusColor.withOpacity(0.15),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: statusColor.withOpacity(0.06),
              blurRadius: 20,
              spreadRadius: 0,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Column(
            children: [
              // ── Top accent bar ────────────────────────────────────────
              Container(
                height: 2,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      statusColor.withOpacity(0),
                      statusColor.withOpacity(0.8),
                      statusColor.withOpacity(0),
                    ],
                  ),
                ),
              ),

              // ── Card Header ───────────────────────────────────────────
              GestureDetector(
                onTap: () => setState(() => _expanded = !_expanded),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          // Platform icon
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                              border:
                                  Border.all(color: statusColor.withOpacity(0.2)),
                            ),
                            child: Icon(
                              widget.getPlatformIcon(platform),
                              color: statusColor.withOpacity(0.9),
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Order ID & Platform
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '#$shortId',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${platform.toUpperCase()} · ${DateFormat('dd MMM, hh:mm a').format(date)}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Status Badge
                          _StatusBadge(
                            status: status,
                            color: statusColor,
                            icon: widget.getStatusIcon(status),
                            pulseController: widget.pulseController,
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // ── Summary Row ───────────────────────────────────
                      Row(
                        children: [
                          _InfoChip(
                            icon: Icons.inventory_2_outlined,
                            label:
                                '${products.length} item${products.length != 1 ? 's' : ''}',
                          ),
                          const SizedBox(width: 8),
                          _InfoChip(
                            icon: Icons.currency_rupee,
                            label: '₹${total.toStringAsFixed(2)}',
                            highlight: true,
                          ),
                          const Spacer(),
                          AnimatedRotation(
                            turns: _expanded ? 0.5 : 0,
                            duration: const Duration(milliseconds: 250),
                            child: Icon(
                              Icons.keyboard_arrow_down_rounded,
                              color: Colors.white.withOpacity(0.3),
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                    ],
                  ),
                ),
              ),

              // ── Expandable Details Section ─────────────────────────────
              AnimatedSize(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOutCubic,
                child: _expanded
                    ? Container(
                        decoration: BoxDecoration(
                          border: Border(
                            top: BorderSide(
                              color: Colors.white.withOpacity(0.05),
                            ),
                          ),
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Raw message
                            if (order['message'] != null &&
                                (order['message'] as String).isNotEmpty) ...[
                              _SectionLabel(label: 'ORDER MESSAGE'),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.03),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color: Colors.white.withOpacity(0.06)),
                                ),
                                child: Text(
                                  '"${order['message']}"',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: Color(0xFF9CA3AF),
                                    height: 1.5,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],

                            // Products list
                            if (products.isNotEmpty) ...[
                              _SectionLabel(label: 'ORDERED ITEMS'),
                              const SizedBox(height: 8),
                              ...products.asMap().entries.map((entry) {
                                final item =
                                    entry.value as Map<String, dynamic>?;
                                final name = item?['name'] as String? ?? 'Product';
                                final qty = item?['quantity'] as int? ?? 1;
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 6),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.025),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: statusColor.withOpacity(0.7),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          name,
                                          style: const TextStyle(
                                              fontSize: 13,
                                              color: Colors.white70),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.05),
                                          borderRadius:
                                              BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'x$qty',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: statusColor,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                              const SizedBox(height: 14),
                            ] else ...[
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF59E0B).withOpacity(0.05),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                      color:
                                          const Color(0xFFF59E0B).withOpacity(0.15)),
                                ),
                                child: Row(
                                  children: const [
                                    Icon(Icons.auto_awesome,
                                        color: Color(0xFFF59E0B), size: 14),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'AI is processing this order...',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFFF59E0B),
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],

                            // Total Row
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.white.withOpacity(0.04),
                                    Colors.white.withOpacity(0.02),
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.06)),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'GRAND TOTAL (WITH GST)',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                      color: Color(0xFF6B7280),
                                    ),
                                  ),
                                  Text(
                                    '₹${total.toStringAsFixed(2)}',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Invoice Actions
                            if (isCompleted || isProcessing) ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _ActionButton(
                                      icon: Icons.picture_as_pdf_rounded,
                                      label: 'VIEW INVOICE',
                                      color: statusColor,
                                      onTap: () {
                                        widget.fbService
                                            .launchInvoiceUrl(orderId);
                                        ScaffoldMessenger.of(context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                'Opening Invoice #$shortId'),
                                            behavior:
                                                SnackBarBehavior.floating,
                                            backgroundColor:
                                                const Color(0xFF1A1A1A),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  _ActionButton(
                                    icon: Icons.send_rounded,
                                    label: '',
                                    color: const Color(0xFF6B7280),
                                    onTap: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                              'Invoice resent to registered email!'),
                                          behavior: SnackBarBehavior.floating,
                                          backgroundColor: Color(0xFF1A1A1A),
                                        ),
                                      );
                                    },
                                    compact: true,
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Reusable sub-widgets ────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  final Color color;
  final IconData icon;
  final AnimationController pulseController;

  const _StatusBadge({
    required this.status,
    required this.color,
    required this.icon,
    required this.pulseController,
  });

  @override
  Widget build(BuildContext context) {
    final isPending = status.toLowerCase() == 'pending';
    final isProcessing = status.toLowerCase() == 'processing';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isPending || isProcessing)
            AnimatedBuilder(
              animation: pulseController,
              builder: (context, child) => Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color.withOpacity(0.5 + 0.5 * pulseController.value),
                ),
              ),
            )
          else
            Icon(icon, size: 10, color: color),
          const SizedBox(width: 5),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool highlight;

  const _InfoChip({
    required this.icon,
    required this.label,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: highlight
            ? Colors.white.withOpacity(0.06)
            : Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white.withOpacity(0.07)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF9CA3AF)),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: highlight ? FontWeight.bold : FontWeight.normal,
              color: highlight ? Colors.white : const Color(0xFF9CA3AF),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        fontSize: 9,
        fontWeight: FontWeight.w800,
        letterSpacing: 1.5,
        color: Color(0xFF4B5563),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final bool compact;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 14 : 16,
          vertical: 12,
        ),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.25)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 15, color: color),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                  color: color,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
