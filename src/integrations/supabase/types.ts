export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata: Json
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_products: {
        Row: {
          brand: string | null
          competitor_id: string
          created_at: string
          currency: string
          external_product_id: string | null
          id: string
          is_active: boolean
          match_confidence: number | null
          match_method: string | null
          model: string | null
          product_id: string | null
          product_name: string
          product_url: string | null
          sku: string | null
          specification_snapshot: Json
          updated_at: string
        }
        Insert: {
          brand?: string | null
          competitor_id: string
          created_at?: string
          currency?: string
          external_product_id?: string | null
          id?: string
          is_active?: boolean
          match_confidence?: number | null
          match_method?: string | null
          model?: string | null
          product_id?: string | null
          product_name: string
          product_url?: string | null
          sku?: string | null
          specification_snapshot?: Json
          updated_at?: string
        }
        Update: {
          brand?: string | null
          competitor_id?: string
          created_at?: string
          currency?: string
          external_product_id?: string | null
          id?: string
          is_active?: boolean
          match_confidence?: number | null
          match_method?: string | null
          model?: string | null
          product_id?: string | null
          product_name?: string
          product_url?: string | null
          sku?: string | null
          specification_snapshot?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_products_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "competitor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "competitor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean
          marketplace: string | null
          name: string
          notes: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          marketplace?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          marketplace?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cost_components: {
        Row: {
          amount: number
          component_type: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          product_id: string
        }
        Insert: {
          amount: number
          component_type: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          product_id: string
        }
        Update: {
          amount?: number
          component_type?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cost_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "cost_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address: string
          area: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          phone: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          area?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone: string
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          area?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          created_at: string
          customer_count: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          rules: Json
          segment_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_count?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rules?: Json
          segment_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_count?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rules?: Json
          segment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_on_hand: number
          reorder_level: number
          reserved_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_on_hand?: number
          reorder_level?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_on_hand?: number
          reorder_level?: number
          reserved_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          note: string | null
          product_id: string
          quantity_delta: number
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          product_id: string
          quantity_delta: number
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          product_id?: string
          quantity_delta?: number
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      landed_costs: {
        Row: {
          base_cost: number
          calculated_at: string
          currency: string
          customs_cost: number
          duty_cost: number
          id: string
          notes: string | null
          operational_cost: number
          packaging_cost: number
          payment_cost: number
          product_id: string
          shipping_cost: number
          tax_cost: number
          total_landed_cost: number | null
        }
        Insert: {
          base_cost?: number
          calculated_at?: string
          currency?: string
          customs_cost?: number
          duty_cost?: number
          id?: string
          notes?: string | null
          operational_cost?: number
          packaging_cost?: number
          payment_cost?: number
          product_id: string
          shipping_cost?: number
          tax_cost?: number
          total_landed_cost?: number | null
        }
        Update: {
          base_cost?: number
          calculated_at?: string
          currency?: string
          customs_cost?: number
          duty_cost?: number
          id?: string
          notes?: string | null
          operational_cost?: number
          packaging_cost?: number
          payment_cost?: number
          product_id?: string
          shipping_cost?: number
          tax_cost?: number
          total_landed_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "landed_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "landed_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "landed_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          competitor_count: number
          confidence: number | null
          created_at: string
          currency: string
          id: string
          market_high: number | null
          market_low: number | null
          market_median: number | null
          observation_date: string
          product_id: string
        }
        Insert: {
          competitor_count?: number
          confidence?: number | null
          created_at?: string
          currency?: string
          id?: string
          market_high?: number | null
          market_low?: number | null
          market_median?: number | null
          observation_date?: string
          product_id: string
        }
        Update: {
          competitor_count?: number
          confidence?: number | null
          created_at?: string
          currency?: string
          id?: string
          market_high?: number | null
          market_low?: number | null
          market_median?: number | null
          observation_date?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "market_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "market_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_reports: {
        Row: {
          created_at: string
          id: string
          product_count: number
          report: string
          source: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_count?: number
          report: string
          source?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_count?: number
          report?: string
          source?: string
        }
        Relationships: []
      }
      marketing_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          message: string
          metadata: Json
          product_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          product_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          product_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "marketing_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "marketing_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          budget: number | null
          channel: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          id: string
          metadata: Json
          name: string
          start_at: string | null
          status: string
          target_audience: Json
          updated_at: string
        }
        Insert: {
          budget?: number | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          metadata?: Json
          name: string
          start_at?: string | null
          status?: string
          target_audience?: Json
          updated_at?: string
        }
        Update: {
          budget?: number | null
          channel?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          metadata?: Json
          name?: string
          start_at?: string | null
          status?: string
          target_audience?: Json
          updated_at?: string
        }
        Relationships: []
      }
      marketing_recommendations: {
        Row: {
          confidence: number | null
          created_at: string
          description: string
          id: string
          priority: number
          product_id: string | null
          recommendation_data: Json
          recommendation_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          description: string
          id?: string
          priority?: number
          product_id?: string | null
          recommendation_data?: Json
          recommendation_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          description?: string
          id?: string
          priority?: number
          product_id?: string | null
          recommendation_data?: Json
          recommendation_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "marketing_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "marketing_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_reports: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          parameters: Json
          report_data: Json
          report_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          parameters?: Json
          report_data?: Json
          report_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          parameters?: Json
          report_data?: Json
          report_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          area: string | null
          created_at: string
          customer_name: string
          delivery_fee: number
          id: string
          note: string | null
          order_code: string
          phone: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          area?: string | null
          created_at?: string
          customer_name: string
          delivery_fee?: number
          id?: string
          note?: string | null
          order_code?: string
          phone: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          area?: string | null
          created_at?: string
          customer_name?: string
          delivery_fee?: number
          id?: string
          note?: string | null
          order_code?: string
          phone?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      price_observations: {
        Row: {
          competitor_product_id: string | null
          created_at: string
          currency: string
          id: string
          match_confidence: number | null
          match_method: string | null
          notes: string | null
          observed_at: string
          observed_price: number
          product_id: string
          source_name: string
          source_url: string | null
        }
        Insert: {
          competitor_product_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          notes?: string | null
          observed_at?: string
          observed_price: number
          product_id: string
          source_name: string
          source_url?: string | null
        }
        Update: {
          competitor_product_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          match_confidence?: number | null
          match_method?: string | null
          notes?: string | null
          observed_at?: string
          observed_price?: number
          product_id?: string
          source_name?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_observations_competitor_product_id_fkey"
            columns: ["competitor_product_id"]
            isOneToOne: false
            referencedRelation: "competitor_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          created_at: string
          currency: string
          effective_from: string
          effective_to: string | null
          id: string
          notes: string | null
          product_id: string
          source: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          product_id: string
          source?: string | null
          unit_cost: number
        }
        Update: {
          created_at?: string
          currency?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          source?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          author_name: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specifications: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_id: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_specifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_specifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean
          brand: string | null
          category: string | null
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          image_alt: string | null
          image_url: string | null
          is_active: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_preorder: boolean
          low_stock_threshold: number
          manufacturer: string | null
          name: string
          old_price: number | null
          preorder_note: string | null
          preorder_release_date: string | null
          price: number
          sale_ends_at: string | null
          sale_price: number | null
          sale_starts_at: string | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          sort_priority: number
          specs_description: string | null
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          subcategory_id: string | null
          title: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          allow_backorder?: boolean
          brand?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_preorder?: boolean
          low_stock_threshold?: number
          manufacturer?: string | null
          name: string
          old_price?: number | null
          preorder_note?: string | null
          preorder_release_date?: string | null
          price: number
          sale_ends_at?: string | null
          sale_price?: number | null
          sale_starts_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          sort_priority?: number
          specs_description?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          subcategory_id?: string | null
          title?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          allow_backorder?: boolean
          brand?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          is_active?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_preorder?: boolean
          low_stock_threshold?: number
          manufacturer?: string | null
          name?: string
          old_price?: number | null
          preorder_note?: string | null
          preorder_release_date?: string | null
          price?: number
          sale_ends_at?: string | null
          sale_price?: number | null
          sale_starts_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          sort_priority?: number
          specs_description?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          subcategory_id?: string | null
          title?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_inventory: {
        Row: {
          available_quantity: number | null
          price: number | null
          product_id: string | null
          product_name: string | null
          quantity_on_hand: number | null
          reorder_level: number | null
          reserved_quantity: number | null
          sku: string | null
          stock_status: string | null
        }
        Relationships: []
      }
      product_price_intelligence: {
        Row: {
          brand: string | null
          competitor_count: number | null
          market_confidence: number | null
          market_high: number | null
          market_low: number | null
          market_median: number | null
          market_position: string | null
          observation_date: string | null
          our_price: number | null
          price_difference_percent: number | null
          product_id: string | null
          product_name: string | null
          sku: string | null
        }
        Relationships: []
      }
      product_sales_analytics: {
        Row: {
          average_selling_price: number | null
          order_count: number | null
          product_id: string | null
          product_name: string | null
          revenue: number | null
          units_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "current_inventory"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_price_intelligence"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_marketing_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_status: "draft" | "published" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "customer"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_status: ["draft", "published", "archived"],
    },
  },
} as const
