// ============================================================
// Supabase Database Types
// supabase/schema.sql ile birebir eşleşir.
// İleride `supabase gen types typescript` ile otomatik üretilebilir,
// şimdilik elle senkron tutuluyor.
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type OrderItemType = 'product' | 'custom'

export type DesignStatus = 'draft' | 'ordered' | 'archived'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          postal_code: string | null
          country: string | null
          locale: 'tr' | 'en'
          marketing_opt: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string | null
          locale?: 'tr' | 'en'
          marketing_opt?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }

      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          guest_email: string | null
          subtotal: number
          vat_amount: number
          shipping_amount: number
          total_amount: number
          currency: string
          status: OrderStatus
          shipping_name: string | null
          shipping_phone: string | null
          shipping_address1: string | null
          shipping_address2: string | null
          shipping_city: string | null
          shipping_postal: string | null
          shipping_country: string | null
          iyzico_payment_id: string | null
          iyzico_token: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          order_number?: string
          user_id?: string | null
          guest_email?: string | null
          subtotal: number
          vat_amount?: number
          shipping_amount?: number
          total_amount: number
          currency?: string
          status?: OrderStatus
          shipping_name?: string | null
          shipping_phone?: string | null
          shipping_address1?: string | null
          shipping_address2?: string | null
          shipping_city?: string | null
          shipping_postal?: string | null
          shipping_country?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']> & {
          iyzico_payment_id?: string | null
          iyzico_token?: string | null
          paid_at?: string | null
          status?: OrderStatus
        }
      }

      order_items: {
        Row: {
          id: string
          order_id: string
          item_type: OrderItemType
          sanity_product_id: string | null
          registry_no: string
          product_name: string
          unit_price: number
          quantity: number
          total_price: number
          custom_design_id: string | null
          created_at: string
        }
        Insert: {
          order_id: string
          item_type?: OrderItemType
          sanity_product_id?: string | null
          registry_no: string
          product_name: string
          unit_price: number
          quantity?: number
          total_price: number
          custom_design_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }

      custom_designs: {
        Row: {
          id: string
          user_id: string | null
          guest_session_id: string | null
          collection_key: string
          design_data: CustomDesignData
          total_price: number
          snapshot_url: string | null
          status: DesignStatus
          design_ref: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string | null
          guest_session_id?: string | null
          collection_key: string
          design_data: CustomDesignData
          total_price: number
          snapshot_url?: string | null
          status?: DesignStatus
        }
        Update: Partial<Database['public']['Tables']['custom_designs']['Insert']>
      }
    }
  }
}

// design_data JSONB kolonunun içeriği
export interface CustomDesignData {
  currency: 'TRY' | 'USD' // tasarımın kaydedildiği andaki para birimi (donmuş, değişmez)
  parts: Array<{
    slotType: 'base' | 'body' | 'head'
    partId: string
    materialId: string
    price: number // currency alanındaki para biriminde, sabit
  }>
  lightColor: string
  lightBrightness: number
}

// Kolaylık tipleri
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type CustomDesignRow = Database['public']['Tables']['custom_designs']['Row']
