import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/database_service.dart';
import '../theme/app_theme.dart';

class CommunityScreen extends StatelessWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Community Hub'),
          bottom: const TabBar(
            indicatorColor: AppTheme.primary,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textSecondary,
            tabs: [
              Tab(text: 'Events', icon: Icon(Icons.event)),
              Tab(text: 'Gallery', icon: Icon(Icons.photo_library)),
              Tab(text: 'Finances', icon: Icon(Icons.account_balance_wallet)),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            _EventsTab(),
            _GalleryTab(),
            _FinancesTab(),
          ],
        ),
      ),
    );
  }
}

class _EventsTab extends StatelessWidget {
  const _EventsTab();

  @override
  Widget build(BuildContext context) {
    final db = Provider.of<DatabaseService>(context);
    final events = db.events;

    if (events.isEmpty) {
      return const Center(child: Text('No upcoming events currently scheduled.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final e = events[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 14),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      e['title'] ?? '',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        e['date'] ?? '',
                        style: const TextStyle(color: Color(0xFF2563EB), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                if ((e['time'] ?? '').isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text('⏰ Time: ${e['time']}', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
                const SizedBox(height: 8),
                Text(
                  e['description'] ?? '',
                  style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _GalleryTab extends StatelessWidget {
  const _GalleryTab();

  @override
  Widget build(BuildContext context) {
    final db = Provider.of<DatabaseService>(context);
    final gallery = db.gallery;

    if (gallery.isEmpty) {
      return const Center(child: Text('No photos in gallery yet.'));
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.9,
      ),
      itemCount: gallery.length,
      itemBuilder: (context, index) {
        final item = gallery[index];
        final url = item['imageUrl']?.toString() ?? '';

        return ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                url,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[200],
                  child: const Icon(Icons.image, color: Colors.grey),
                ),
              ),
              if ((item['caption'] ?? '').isNotEmpty)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    color: Colors.black54,
                    child: Text(
                      item['caption'] ?? '',
                      style: const TextStyle(color: Colors.white, fontSize: 11),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _FinancesTab extends StatelessWidget {
  const _FinancesTab();

  @override
  Widget build(BuildContext context) {
    final db = Provider.of<DatabaseService>(context);
    final funds = db.finances['funds'] as Map<dynamic, dynamic>? ?? {};
    final expenses = db.finances['expenses'] as Map<dynamic, dynamic>? ?? {};

    double totalFunds = 0;
    for (final v in funds.values) {
      if (v is Map && v['amount'] != null) {
        totalFunds += (v['amount'] as num).toDouble();
      }
    }

    double totalExpenses = 0;
    for (final v in expenses.values) {
      if (v is Map && v['amount'] != null) {
        totalExpenses += (v['amount'] as num).toDouble();
      }
    }

    final netBalance = totalFunds - totalExpenses;
    final currencyFormatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Net Balance Banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF1E293B), Color(0xFF0F172A)]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                const Text('TOTAL AVAILABLE BALANCE', style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  currencyFormatter.format(netBalance),
                  style: const TextStyle(color: Color(0xFFFDE68A), fontSize: 32, fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Column(
                      children: [
                        const Text('Total Collected', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        Text(currencyFormatter.format(totalFunds), style: const TextStyle(color: Color(0xFF6EE7B7), fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    Column(
                      children: [
                        const Text('Total Spent', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        Text(currencyFormatter.format(totalExpenses), style: const TextStyle(color: Color(0xFFF87171), fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
