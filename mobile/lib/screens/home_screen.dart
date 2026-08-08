import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:retailmind_mobile/services/firebase_service.dart';
import 'package:retailmind_mobile/screens/order_form_screen.dart';
import 'package:retailmind_mobile/screens/order_history_screen.dart';
import 'package:retailmind_mobile/screens/notifications_screen.dart';
import 'package:retailmind_mobile/screens/profile_screen.dart';
import 'dart:math' as math;

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  late AnimationController _tabAnimController;

  @override
  void initState() {
    super.initState();
    _tabAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _tabAnimController.dispose();
    super.dispose();
  }

  final List<Widget> _views = const [
    CustomerDashboardView(),
    OrderHistoryScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080808),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        transitionBuilder: (child, anim) => FadeTransition(
          opacity: anim,
          child: child,
        ),
        child: KeyedSubtree(
          key: ValueKey<int>(_currentIndex),
          child: _views[_currentIndex],
        ),
      ),
      bottomNavigationBar: _PremiumNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}

// ── Premium Animated Nav Bar ────────────────────────────────────────────────

class _PremiumNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _PremiumNavBar({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final items = [
      _NavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard_rounded, label: 'Dashboard'),
      _NavItem(icon: Icons.shopping_bag_outlined, activeIcon: Icons.shopping_bag_rounded, label: 'Orders'),
      _NavItem(icon: Icons.notifications_outlined, activeIcon: Icons.notifications_rounded, label: 'Alerts'),
      _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
    ];

    return Container(
      height: 76 + MediaQuery.of(context).padding.bottom,
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom),
      decoration: BoxDecoration(
        color: const Color(0xFF0C0C0C),
        border: Border(
          top: BorderSide(color: Colors.white.withOpacity(0.06), width: 0.8),
        ),
      ),
      child: Row(
        children: items.asMap().entries.map((entry) {
          final idx = entry.key;
          final item = entry.value;
          final selected = currentIndex == idx;

          return Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => onTap(idx),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      width: selected ? 48 : 40,
                      height: selected ? 32 : 28,
                      decoration: BoxDecoration(
                        color: selected
                            ? Colors.white.withOpacity(0.1)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        selected ? item.activeIcon : item.icon,
                        size: selected ? 22 : 20,
                        color: selected
                            ? Colors.white
                            : const Color(0xFF4B5563),
                      ),
                    ),
                    const SizedBox(height: 4),
                    AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 250),
                      style: TextStyle(
                        fontSize: selected ? 10 : 9,
                        fontWeight:
                            selected ? FontWeight.bold : FontWeight.normal,
                        color: selected
                            ? Colors.white
                            : const Color(0xFF4B5563),
                        letterSpacing: 0.3,
                      ),
                      child: Text(item.label),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem(
      {required this.icon, required this.activeIcon, required this.label});
}

// ── Customer Dashboard View ─────────────────────────────────────────────────

class CustomerDashboardView extends StatefulWidget {
  const CustomerDashboardView({super.key});

  @override
  State<CustomerDashboardView> createState() => _CustomerDashboardViewState();
}

class _CustomerDashboardViewState extends State<CustomerDashboardView>
    with TickerProviderStateMixin {
  late AnimationController _bgController;
  late AnimationController _pulseController;
  late AnimationController _statsController;

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _statsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
  }

  @override
  void dispose() {
    _bgController.dispose();
    _pulseController.dispose();
    _statsController.dispose();
    super.dispose();
  }

  final List<Map<String, dynamic>> channels = [
    {
      'id': 'whatsapp',
      'name': 'WhatsApp Chat',
      'desc': 'Orders via WhatsApp integration',
      'icon': Icons.chat_rounded,
      'color': const Color(0xFF25D366),
    },
    {
      'id': 'instagram',
      'name': 'Instagram DM',
      'desc': 'Instagram customer messages',
      'icon': Icons.camera_alt_rounded,
      'color': const Color(0xFFE1306C),
    },
    {
      'id': 'website',
      'name': 'Direct Website',
      'desc': 'Official website sales channel',
      'icon': Icons.language_rounded,
      'color': const Color(0xFF60A5FA),
    },
    {
      'id': 'email',
      'name': 'Customer Email',
      'desc': 'Corporate email invoice orders',
      'icon': Icons.mail_rounded,
      'color': const Color(0xFFFBBF24),
    },
  ];

  @override
  Widget build(BuildContext context) {
    final fbService = Provider.of<FirebaseService>(context, listen: false);
    final user = fbService.currentUser;
    final userName = user?['name'] ?? 'Guest';
    final isFirebase = fbService.isFirebaseInitialized;

    return Scaffold(
      backgroundColor: const Color(0xFF080808),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── Animated Hero AppBar ──────────────────────────────────────
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: const Color(0xFF080808),
            surfaceTintColor: Colors.transparent,
            flexibleSpace: FlexibleSpaceBar(
              background: _HeroBackground(
                bgController: _bgController,
                pulseController: _pulseController,
                userName: userName,
                isFirebase: isFirebase,
              ),
              collapseMode: CollapseMode.pin,
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(0),
              child: Container(
                height: 1,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),

          // ── Stats Row ─────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
              child: _StatsRow(
                fbService: fbService,
                statsController: _statsController,
              ),
            ),
          ),

          // ── Section Header ────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 28, 16, 16),
              child: Row(
                children: [
                  Container(
                    width: 3,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'ORDER CHANNELS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.05),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${channels.length} ACTIVE',
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Channel Cards ─────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final ch = channels[index];
                  return _ChannelCard(
                    channel: ch,
                    index: index,
                    pulseController: _pulseController,
                  );
                },
                childCount: channels.length,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Hero Background ─────────────────────────────────────────────────────────

class _HeroBackground extends StatelessWidget {
  final AnimationController bgController;
  final AnimationController pulseController;
  final String userName;
  final bool isFirebase;

  const _HeroBackground({
    required this.bgController,
    required this.pulseController,
    required this.userName,
    required this.isFirebase,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Animated gradient background
        AnimatedBuilder(
          animation: bgController,
          builder: (context, child) {
            return CustomPaint(
              painter: _OrbitPainter(bgController.value),
              child: child,
            );
          },
          child: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF111111), Color(0xFF080808)],
              ),
            ),
          ),
        ),

        // Content overlay
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: logo + status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Logo mark
                    Row(
                      children: [
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.auto_awesome,
                            color: Color(0xFF080808),
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'RETAILMIND',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),

                    // Connection badge
                    AnimatedBuilder(
                      animation: pulseController,
                      builder: (context, child) => Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: (isFirebase
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFF6B7280))
                              .withOpacity(0.1 +
                                  0.06 * pulseController.value),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: (isFirebase
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF6B7280))
                                .withOpacity(0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isFirebase
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF6B7280),
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              isFirebase ? 'LIVE' : 'OFFLINE',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                                color: isFirebase
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Greeting
                Text(
                  'Hello,',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.4),
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  userName,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),
                Text(
                  'Manage channels · track inventory · sync in real-time',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.35),
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Orbit Painter ────────────────────────────────────────────────────────────

class _OrbitPainter extends CustomPainter {
  final double progress;
  _OrbitPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.5;

    // Draw subtle rotating arcs in top-right corner
    for (int i = 0; i < 3; i++) {
      final radius = 60.0 + i * 45;
      final angle = progress * 2 * math.pi + i * math.pi / 3;
      paint.color = Colors.white.withOpacity(0.04 - i * 0.01);

      final rect = Rect.fromCircle(
        center: Offset(size.width + 20, -20),
        radius: radius,
      );
      canvas.drawArc(rect, angle, math.pi * 1.2, false, paint);
    }

    // Floating particles
    final dotPaint = Paint()..style = PaintingStyle.fill;
    final positions = [
      Offset(size.width * 0.8, size.height * 0.3),
      Offset(size.width * 0.6, size.height * 0.7),
      Offset(size.width * 0.9, size.height * 0.6),
    ];
    for (int i = 0; i < positions.length; i++) {
      final floatY =
          math.sin(progress * 2 * math.pi + i * 1.2) * 6;
      dotPaint.color = Colors.white.withOpacity(0.05);
      canvas.drawCircle(
        positions[i].translate(0, floatY),
        2.0,
        dotPaint,
      );
    }
  }

  @override
  bool shouldRepaint(_OrbitPainter old) => true;
}

// ── Stats Row ────────────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  final FirebaseService fbService;
  final AnimationController statsController;

  const _StatsRow({required this.fbService, required this.statsController});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: fbService.ordersStream(),
      builder: (context, snapshot) {
        final orders = snapshot.data ?? [];
        final pending =
            orders.where((o) => (o['status'] ?? '').toString().toLowerCase() == 'pending').length;
        final completed =
            orders.where((o) => (o['status'] ?? '').toString().toLowerCase() == 'completed').length;
        final processing =
            orders.where((o) => (o['status'] ?? '').toString().toLowerCase() == 'processing').length;

        return Row(
          children: [
            Expanded(
              child: _StatCard(
                label: 'TOTAL',
                value: '${orders.length}',
                icon: Icons.list_alt_rounded,
                color: Colors.white,
                controller: statsController,
                delay: 0,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _StatCard(
                label: 'PENDING',
                value: '$pending',
                icon: Icons.hourglass_empty_rounded,
                color: const Color(0xFFF59E0B),
                controller: statsController,
                delay: 0.2,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _StatCard(
                label: 'DONE',
                value: '$completed',
                icon: Icons.check_circle_rounded,
                color: const Color(0xFF34D399),
                controller: statsController,
                delay: 0.4,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final AnimationController controller;
  final double delay;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.controller,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        final progress = math.max(0.0, (controller.value - delay) / (1 - delay));
        return Transform.translate(
          offset: Offset(0, 20 * (1 - progress)),
          child: Opacity(opacity: progress, child: child),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.15)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color.withOpacity(0.8), size: 18),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.8,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Channel Card ─────────────────────────────────────────────────────────────

class _ChannelCard extends StatefulWidget {
  final Map<String, dynamic> channel;
  final int index;
  final AnimationController pulseController;

  const _ChannelCard({
    required this.channel,
    required this.index,
    required this.pulseController,
  });

  @override
  State<_ChannelCard> createState() => _ChannelCardState();
}

class _ChannelCardState extends State<_ChannelCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _entranceController;
  late Animation<double> _slideAnim;
  late Animation<double> _fadeAnim;
  bool _pressed = false;

  @override
  void initState() {
    super.initState();
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _slideAnim = Tween<double>(begin: 30, end: 0).animate(
      CurvedAnimation(
          parent: _entranceController, curve: Curves.easeOutCubic),
    );
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _entranceController, curve: Curves.easeOut),
    );

    Future.delayed(Duration(milliseconds: 150 + widget.index * 100), () {
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
    final ch = widget.channel;
    final color = ch['color'] as Color;

    return AnimatedBuilder(
      animation: _entranceController,
      builder: (context, child) => Transform.translate(
        offset: Offset(0, _slideAnim.value),
        child: Opacity(opacity: _fadeAnim.value, child: child),
      ),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: () {
          Navigator.of(context).push(
            PageRouteBuilder(
              pageBuilder: (context, animation, secondaryAnimation) =>
                  OrderFormScreen(
                platformId: ch['id'] as String,
                platformLabel: ch['name'] as String,
                accentColor: color,
              ),
              transitionsBuilder:
                  (context, animation, secondaryAnimation, child) {
                return SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(1, 0),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(
                      parent: animation, curve: Curves.easeOutCubic)),
                  child: child,
                );
              },
            ),
          );
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          margin: const EdgeInsets.only(bottom: 12),
          transform: Matrix4.identity()..scale(_pressed ? 0.97 : 1.0),
          decoration: BoxDecoration(
            color: _pressed
                ? color.withOpacity(0.1)
                : const Color(0xFF0F0F0F),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: _pressed
                  ? color.withOpacity(0.4)
                  : color.withOpacity(0.12),
              width: 1.2,
            ),
            boxShadow: _pressed
                ? [
                    BoxShadow(
                      color: color.withOpacity(0.15),
                      blurRadius: 20,
                    )
                  ]
                : [],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(18),
            child: Stack(
              children: [
                // Top accent bar
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 2,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          color.withOpacity(0),
                          color.withOpacity(0.6),
                          color.withOpacity(0),
                        ],
                      ),
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      // Animated icon container
                      _FloatingIcon(
                        icon: ch['icon'] as IconData,
                        color: color,
                        pulseController: widget.pulseController,
                        index: widget.index,
                      ),
                      const SizedBox(width: 14),

                      // Labels
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ch['name'] as String,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              ch['desc'] as String,
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Arrow indicator
                      Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(8),
                          border:
                              Border.all(color: color.withOpacity(0.15)),
                        ),
                        child: Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 12,
                          color: color.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Floating Icon with floating animation ───────────────────────────────────

class _FloatingIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final AnimationController pulseController;
  final int index;

  const _FloatingIcon({
    required this.icon,
    required this.color,
    required this.pulseController,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: pulseController,
      builder: (context, child) {
        // Each icon floats at a different phase
        final phase = (index * 0.3 + pulseController.value);
        final offset = math.sin(phase * math.pi) * 3.5;
        return Transform.translate(
          offset: Offset(0, -offset),
          child: child,
        );
      },
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.25), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.15),
              blurRadius: 12,
              spreadRadius: -2,
            ),
          ],
        ),
        child: Icon(icon, color: color, size: 22),
      ),
    );
  }
}
