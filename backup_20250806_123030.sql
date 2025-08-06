--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: authortype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.authortype AS ENUM (
    'staff',
    'customer'
);


ALTER TYPE public.authortype OWNER TO postgres;

--
-- Name: componenttype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.componenttype AS ENUM (
    'flower',
    'material',
    'service'
);


ALTER TYPE public.componenttype OWNER TO postgres;

--
-- Name: customerfeedback; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.customerfeedback AS ENUM (
    'like',
    'dislike'
);


ALTER TYPE public.customerfeedback OWNER TO postgres;

--
-- Name: deliverymethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.deliverymethod AS ENUM (
    'delivery',
    'self_pickup'
);


ALTER TYPE public.deliverymethod OWNER TO postgres;

--
-- Name: issuetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.issuetype AS ENUM (
    'wrong_address',
    'recipient_unavailable',
    'quality_issue',
    'wrong_order',
    'delivery_delay',
    'other'
);


ALTER TYPE public.issuetype OWNER TO postgres;

--
-- Name: movementtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.movementtype AS ENUM (
    'IN',
    'OUT',
    'ADJUSTMENT'
);


ALTER TYPE public.movementtype OWNER TO postgres;

--
-- Name: ordereventtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ordereventtype AS ENUM (
    'created',
    'status_changed',
    'comment_added',
    'issue_reported',
    'florist_assigned',
    'courier_assigned',
    'payment_received',
    'edited'
);


ALTER TYPE public.ordereventtype OWNER TO postgres;

--
-- Name: orderstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.orderstatus AS ENUM (
    'new',
    'paid',
    'assembled',
    'delivery',
    'self_pickup',
    'delivered',
    'completed',
    'issue'
);


ALTER TYPE public.orderstatus OWNER TO postgres;

--
-- Name: paymentmethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.paymentmethod AS ENUM (
    'kaspi',
    'cash',
    'transfer',
    'qr'
);


ALTER TYPE public.paymentmethod OWNER TO postgres;

--
-- Name: phototype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.phototype AS ENUM (
    'pre_delivery',
    'completion',
    'process'
);


ALTER TYPE public.phototype OWNER TO postgres;

--
-- Name: productcategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.productcategory AS ENUM (
    'bouquet',
    'composition',
    'potted',
    'other'
);


ALTER TYPE public.productcategory OWNER TO postgres;

--
-- Name: taskpriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskpriority AS ENUM (
    'urgent',
    'high',
    'normal',
    'low'
);


ALTER TYPE public.taskpriority OWNER TO postgres;

--
-- Name: taskstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskstatus AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'quality_check',
    'completed',
    'cancelled'
);


ALTER TYPE public.taskstatus OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'admin',
    'manager',
    'florist',
    'courier'
);


ALTER TYPE public.userrole OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: calculator_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calculator_settings (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    default_labor_cost numeric(10,2) NOT NULL,
    min_margin_percent numeric(5,2),
    recommended_margin_percent numeric(5,2),
    premium_margin_percent numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.calculator_settings OWNER TO postgres;

--
-- Name: calculator_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calculator_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.calculator_settings_id_seq OWNER TO postgres;

--
-- Name: calculator_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calculator_settings_id_seq OWNED BY public.calculator_settings.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    user_id integer,
    text text NOT NULL,
    author_type public.authortype NOT NULL,
    customer_name character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO postgres;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    name character varying NOT NULL,
    address character varying NOT NULL,
    email character varying NOT NULL,
    phones json NOT NULL,
    working_hours json NOT NULL,
    delivery_zones json NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.company_settings OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.company_settings_id_seq OWNER TO postgres;

--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_addresses (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    address character varying NOT NULL,
    label character varying,
    is_primary integer,
    usage_count integer,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer_addresses OWNER TO postgres;

--
-- Name: customer_addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_addresses_id_seq OWNER TO postgres;

--
-- Name: customer_addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_addresses_id_seq OWNED BY public.customer_addresses.id;


--
-- Name: customer_important_dates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_important_dates (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    date character varying NOT NULL,
    description character varying NOT NULL,
    remind_days_before integer,
    last_reminded_year integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customer_important_dates OWNER TO postgres;

--
-- Name: customer_important_dates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_important_dates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_important_dates_id_seq OWNER TO postgres;

--
-- Name: customer_important_dates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_important_dates_id_seq OWNED BY public.customer_important_dates.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    phone character varying NOT NULL,
    name character varying,
    email character varying,
    shop_id integer NOT NULL,
    orders_count integer,
    total_spent double precision,
    last_order_date timestamp with time zone,
    notes text,
    preferences text,
    source character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO postgres;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: decorative_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.decorative_materials (
    id integer NOT NULL,
    shop_id integer NOT NULL,
    name character varying NOT NULL,
    category character varying,
    price numeric(10,2) NOT NULL,
    unit character varying,
    is_active boolean,
    in_stock boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.decorative_materials OWNER TO postgres;

--
-- Name: decorative_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.decorative_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.decorative_materials_id_seq OWNER TO postgres;

--
-- Name: decorative_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.decorative_materials_id_seq OWNED BY public.decorative_materials.id;


--
-- Name: deliveries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliveries (
    id integer NOT NULL,
    supplier character varying NOT NULL,
    farm character varying NOT NULL,
    delivery_date timestamp with time zone NOT NULL,
    currency character varying NOT NULL,
    rate double precision NOT NULL,
    cost_total double precision NOT NULL,
    comment character varying,
    created_at timestamp with time zone DEFAULT now(),
    created_by character varying
);


ALTER TABLE public.deliveries OWNER TO postgres;

--
-- Name: deliveries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.deliveries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.deliveries_id_seq OWNER TO postgres;

--
-- Name: deliveries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.deliveries_id_seq OWNED BY public.deliveries.id;


--
-- Name: delivery_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_positions (
    id integer NOT NULL,
    delivery_id integer NOT NULL,
    variety character varying NOT NULL,
    height_cm integer NOT NULL,
    qty integer NOT NULL,
    cost_per_stem double precision NOT NULL,
    total_cost double precision NOT NULL
);


ALTER TABLE public.delivery_positions OWNER TO postgres;

--
-- Name: delivery_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.delivery_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.delivery_positions_id_seq OWNER TO postgres;

--
-- Name: delivery_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.delivery_positions_id_seq OWNED BY public.delivery_positions.id;


--
-- Name: florist_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.florist_tasks (
    id integer NOT NULL,
    order_id integer NOT NULL,
    florist_id integer,
    task_type character varying NOT NULL,
    status public.taskstatus NOT NULL,
    priority public.taskpriority NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    assigned_at timestamp with time zone,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    deadline timestamp with time zone,
    estimated_minutes integer,
    actual_minutes integer,
    quality_score double precision,
    work_photos json,
    result_photos json,
    instructions character varying,
    florist_notes character varying,
    quality_notes character varying
);


ALTER TABLE public.florist_tasks OWNER TO postgres;

--
-- Name: florist_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.florist_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.florist_tasks_id_seq OWNER TO postgres;

--
-- Name: florist_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.florist_tasks_id_seq OWNED BY public.florist_tasks.id;


--
-- Name: flower_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flower_categories (
    id integer NOT NULL,
    name character varying NOT NULL,
    markup_percentage double precision NOT NULL,
    keywords text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.flower_categories OWNER TO postgres;

--
-- Name: flower_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.flower_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.flower_categories_id_seq OWNER TO postgres;

--
-- Name: flower_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.flower_categories_id_seq OWNED BY public.flower_categories.id;


--
-- Name: order_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_history (
    id integer NOT NULL,
    order_id integer NOT NULL,
    user_id integer,
    event_type public.ordereventtype NOT NULL,
    old_status character varying,
    new_status character varying,
    comment character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.order_history OWNER TO postgres;

--
-- Name: order_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_history_id_seq OWNER TO postgres;

--
-- Name: order_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_history_id_seq OWNED BY public.order_history.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    product_name character varying NOT NULL,
    product_category character varying NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    total double precision NOT NULL,
    warehouse_item_id integer,
    is_reserved boolean,
    is_written_off boolean,
    reserved_at timestamp with time zone,
    written_off_at timestamp with time zone
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_id_seq OWNER TO postgres;

--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: order_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_photos (
    id integer NOT NULL,
    order_id integer NOT NULL,
    photo_url character varying NOT NULL,
    photo_type public.phototype NOT NULL,
    description text,
    uploaded_by_user_id integer NOT NULL,
    customer_feedback public.customerfeedback,
    feedback_comment text,
    feedback_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.order_photos OWNER TO postgres;

--
-- Name: order_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_photos_id_seq OWNER TO postgres;

--
-- Name: order_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_photos_id_seq OWNED BY public.order_photos.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status public.orderstatus NOT NULL,
    customer_id integer,
    customer_phone character varying NOT NULL,
    recipient_phone character varying,
    recipient_name character varying,
    address character varying,
    address_needs_clarification boolean,
    delivery_method public.deliverymethod NOT NULL,
    delivery_window json,
    flower_sum double precision NOT NULL,
    delivery_fee double precision,
    total double precision NOT NULL,
    has_pre_delivery_photos boolean,
    has_issue boolean,
    issue_type public.issuetype,
    issue_comment character varying,
    tracking_token character varying,
    payment_method public.paymentmethod,
    payment_date timestamp with time zone,
    card_text character varying,
    delivery_time_text character varying,
    source character varying,
    shop_id integer NOT NULL,
    assigned_florist_id integer,
    courier_id integer,
    courier_phone character varying
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_id_seq OWNER TO postgres;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: product_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_components (
    id integer NOT NULL,
    product_id integer NOT NULL,
    component_type public.componenttype NOT NULL,
    name character varying NOT NULL,
    description character varying,
    quantity integer NOT NULL,
    unit character varying,
    unit_cost double precision,
    unit_price double precision,
    warehouse_item_id integer,
    material_id integer
);


ALTER TABLE public.product_components OWNER TO postgres;

--
-- Name: product_components_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_components_id_seq OWNER TO postgres;

--
-- Name: product_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_components_id_seq OWNED BY public.product_components.id;


--
-- Name: product_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_images (
    id integer NOT NULL,
    product_id integer NOT NULL,
    image_url character varying NOT NULL,
    is_primary boolean,
    sort_order integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.product_images OWNER TO postgres;

--
-- Name: product_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_images_id_seq OWNER TO postgres;

--
-- Name: product_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_images_id_seq OWNED BY public.product_images.id;


--
-- Name: product_ingredients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_ingredients (
    id integer NOT NULL,
    product_id integer NOT NULL,
    warehouse_item_id integer NOT NULL,
    quantity integer NOT NULL,
    notes character varying
);


ALTER TABLE public.product_ingredients OWNER TO postgres;

--
-- Name: product_ingredients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_ingredients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_ingredients_id_seq OWNER TO postgres;

--
-- Name: product_ingredients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_ingredients_id_seq OWNED BY public.product_ingredients.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying NOT NULL,
    category public.productcategory NOT NULL,
    description text,
    image_url character varying,
    shop_id integer NOT NULL,
    cost_price double precision NOT NULL,
    retail_price double precision NOT NULL,
    sale_price double precision,
    is_active boolean,
    is_popular boolean,
    is_new boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: shops; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shops (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(100),
    telegram_id character varying(50),
    telegram_username character varying(50),
    address text,
    city character varying(50),
    description text,
    whatsapp_number character varying(20),
    shop_domain character varying(50),
    shop_logo_url character varying(255),
    business_hours json,
    currency character varying(3),
    timezone character varying(50),
    language character varying(2),
    is_active boolean,
    is_verified boolean,
    plan character varying(20),
    trial_ends_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_login_at timestamp without time zone
);


ALTER TABLE public.shops OWNER TO postgres;

--
-- Name: shops_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.shops_id_seq OWNER TO postgres;

--
-- Name: shops_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shops_id_seq OWNED BY public.shops.id;


--
-- Name: supplies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplies (
    id integer NOT NULL,
    supplier character varying NOT NULL,
    farm character varying,
    delivery_date timestamp with time zone DEFAULT now() NOT NULL,
    currency character varying NOT NULL,
    rate double precision NOT NULL,
    total_cost double precision NOT NULL,
    status character varying,
    notes text,
    comment character varying,
    created_at timestamp with time zone DEFAULT now(),
    created_by character varying
);


ALTER TABLE public.supplies OWNER TO postgres;

--
-- Name: supplies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.supplies_id_seq OWNER TO postgres;

--
-- Name: supplies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplies_id_seq OWNED BY public.supplies.id;


--
-- Name: supply_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supply_items (
    id integer NOT NULL,
    supply_id integer NOT NULL,
    category_id integer,
    flower_name character varying NOT NULL,
    height_cm integer NOT NULL,
    purchase_price double precision NOT NULL,
    quantity integer NOT NULL,
    remaining_quantity integer NOT NULL,
    retail_price double precision NOT NULL,
    total_cost double precision NOT NULL,
    batch_code character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.supply_items OWNER TO postgres;

--
-- Name: supply_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supply_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.supply_items_id_seq OWNER TO postgres;

--
-- Name: supply_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supply_items_id_seq OWNED BY public.supply_items.id;


--
-- Name: task_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_items (
    id integer NOT NULL,
    task_id integer NOT NULL,
    order_item_id integer NOT NULL,
    quantity integer NOT NULL,
    is_completed boolean,
    completed_at timestamp with time zone,
    quality_approved boolean,
    quality_notes character varying
);


ALTER TABLE public.task_items OWNER TO postgres;

--
-- Name: task_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.task_items_id_seq OWNER TO postgres;

--
-- Name: task_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_items_id_seq OWNED BY public.task_items.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    phone character varying NOT NULL,
    name character varying NOT NULL,
    email character varying,
    role public.userrole NOT NULL,
    is_active boolean,
    telegram_id character varying,
    shop_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouse_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_items (
    id integer NOT NULL,
    sku character varying NOT NULL,
    batch_code character varying NOT NULL,
    variety character varying NOT NULL,
    height_cm integer NOT NULL,
    farm character varying NOT NULL,
    supplier character varying NOT NULL,
    delivery_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    currency character varying NOT NULL,
    rate double precision NOT NULL,
    cost double precision NOT NULL,
    recommended_price double precision NOT NULL,
    price double precision NOT NULL,
    markup_pct double precision NOT NULL,
    qty integer NOT NULL,
    reserved_qty integer NOT NULL,
    on_showcase boolean,
    to_write_off boolean,
    hidden boolean,
    updated_by character varying,
    supply_item_id integer
);


ALTER TABLE public.warehouse_items OWNER TO postgres;

--
-- Name: warehouse_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouse_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.warehouse_items_id_seq OWNER TO postgres;

--
-- Name: warehouse_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouse_items_id_seq OWNED BY public.warehouse_items.id;


--
-- Name: warehouse_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_movements (
    id integer NOT NULL,
    warehouse_item_id integer NOT NULL,
    type public.movementtype NOT NULL,
    quantity integer NOT NULL,
    description character varying NOT NULL,
    reference_type character varying,
    reference_id character varying,
    created_at timestamp with time zone DEFAULT now(),
    created_by character varying NOT NULL,
    qty_before integer NOT NULL,
    qty_after integer NOT NULL
);


ALTER TABLE public.warehouse_movements OWNER TO postgres;

--
-- Name: warehouse_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.warehouse_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.warehouse_movements_id_seq OWNER TO postgres;

--
-- Name: warehouse_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.warehouse_movements_id_seq OWNED BY public.warehouse_movements.id;


--
-- Name: calculator_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calculator_settings ALTER COLUMN id SET DEFAULT nextval('public.calculator_settings_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: customer_addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses ALTER COLUMN id SET DEFAULT nextval('public.customer_addresses_id_seq'::regclass);


--
-- Name: customer_important_dates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_important_dates ALTER COLUMN id SET DEFAULT nextval('public.customer_important_dates_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: decorative_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decorative_materials ALTER COLUMN id SET DEFAULT nextval('public.decorative_materials_id_seq'::regclass);


--
-- Name: deliveries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries ALTER COLUMN id SET DEFAULT nextval('public.deliveries_id_seq'::regclass);


--
-- Name: delivery_positions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_positions ALTER COLUMN id SET DEFAULT nextval('public.delivery_positions_id_seq'::regclass);


--
-- Name: florist_tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.florist_tasks ALTER COLUMN id SET DEFAULT nextval('public.florist_tasks_id_seq'::regclass);


--
-- Name: flower_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flower_categories ALTER COLUMN id SET DEFAULT nextval('public.flower_categories_id_seq'::regclass);


--
-- Name: order_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history ALTER COLUMN id SET DEFAULT nextval('public.order_history_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: order_photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_photos ALTER COLUMN id SET DEFAULT nextval('public.order_photos_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: product_components id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_components ALTER COLUMN id SET DEFAULT nextval('public.product_components_id_seq'::regclass);


--
-- Name: product_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images ALTER COLUMN id SET DEFAULT nextval('public.product_images_id_seq'::regclass);


--
-- Name: product_ingredients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_ingredients ALTER COLUMN id SET DEFAULT nextval('public.product_ingredients_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: shops id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops ALTER COLUMN id SET DEFAULT nextval('public.shops_id_seq'::regclass);


--
-- Name: supplies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplies ALTER COLUMN id SET DEFAULT nextval('public.supplies_id_seq'::regclass);


--
-- Name: supply_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_items ALTER COLUMN id SET DEFAULT nextval('public.supply_items_id_seq'::regclass);


--
-- Name: task_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_items ALTER COLUMN id SET DEFAULT nextval('public.task_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouse_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_items ALTER COLUMN id SET DEFAULT nextval('public.warehouse_items_id_seq'::regclass);


--
-- Name: warehouse_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_movements ALTER COLUMN id SET DEFAULT nextval('public.warehouse_movements_id_seq'::regclass);


--
-- Data for Name: calculator_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calculator_settings (id, shop_id, default_labor_cost, min_margin_percent, recommended_margin_percent, premium_margin_percent, created_at, updated_at) FROM stdin;
1	1	2000.00	30.00	50.00	100.00	2025-08-05 06:10:19.550236+00	\N
2	2	2000.00	30.00	50.00	100.00	2025-08-05 06:10:42.922389+00	\N
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, order_id, user_id, text, author_type, customer_name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_settings (id, name, address, email, phones, working_hours, delivery_zones, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_addresses (id, customer_id, address, label, is_primary, usage_count, last_used_at, created_at) FROM stdin;
\.


--
-- Data for Name: customer_important_dates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_important_dates (id, customer_id, date, description, remind_days_before, last_reminded_year, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, phone, name, email, shop_id, orders_count, total_spent, last_order_date, notes, preferences, source, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: decorative_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.decorative_materials (id, shop_id, name, category, price, unit, is_active, in_stock, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: deliveries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deliveries (id, supplier, farm, delivery_date, currency, rate, cost_total, comment, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: delivery_positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_positions (id, delivery_id, variety, height_cm, qty, cost_per_stem, total_cost) FROM stdin;
\.


--
-- Data for Name: florist_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.florist_tasks (id, order_id, florist_id, task_type, status, priority, created_at, assigned_at, started_at, completed_at, deadline, estimated_minutes, actual_minutes, quality_score, work_photos, result_photos, instructions, florist_notes, quality_notes) FROM stdin;
\.


--
-- Data for Name: flower_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flower_categories (id, name, markup_percentage, keywords, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_history (id, order_id, user_id, event_type, old_status, new_status, comment, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, product_id, product_name, product_category, quantity, price, total, warehouse_item_id, is_reserved, is_written_off, reserved_at, written_off_at) FROM stdin;
\.


--
-- Data for Name: order_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_photos (id, order_id, photo_url, photo_type, description, uploaded_by_user_id, customer_feedback, feedback_comment, feedback_date, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, created_at, updated_at, status, customer_id, customer_phone, recipient_phone, recipient_name, address, address_needs_clarification, delivery_method, delivery_window, flower_sum, delivery_fee, total, has_pre_delivery_photos, has_issue, issue_type, issue_comment, tracking_token, payment_method, payment_date, card_text, delivery_time_text, source, shop_id, assigned_florist_id, courier_id, courier_phone) FROM stdin;
\.


--
-- Data for Name: product_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_components (id, product_id, component_type, name, description, quantity, unit, unit_cost, unit_price, warehouse_item_id, material_id) FROM stdin;
\.


--
-- Data for Name: product_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_images (id, product_id, image_url, is_primary, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: product_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_ingredients (id, product_id, warehouse_item_id, quantity, notes) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, category, description, image_url, shop_id, cost_price, retail_price, sale_price, is_active, is_popular, is_new, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: shops; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shops (id, name, phone, email, telegram_id, telegram_username, address, city, description, whatsapp_number, shop_domain, shop_logo_url, business_hours, currency, timezone, language, is_active, is_verified, plan, trial_ends_at, created_at, updated_at, last_login_at) FROM stdin;
2	Цветочный магазин 4567	+77771234567	\N	\N	\N	\N	Алматы	\N	\N	\N	\N	null	KZT	Asia/Almaty	ru	t	f	basic	\N	2025-08-05 06:10:40.819223	2025-08-05 06:10:40.833347	2025-08-05 06:10:40.834513
1	Цветочный магазин 4567	+77011234567	\N	\N	\N	\N	Алматы	\N	\N	\N	\N	null	KZT	Asia/Almaty	ru	t	f	basic	\N	2025-08-05 06:07:53.586581	2025-08-06 07:23:39.861388	2025-08-06 07:23:39.866558
\.


--
-- Data for Name: supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplies (id, supplier, farm, delivery_date, currency, rate, total_cost, status, notes, comment, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: supply_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supply_items (id, supply_id, category_id, flower_name, height_cm, purchase_price, quantity, remaining_quantity, retail_price, total_cost, batch_code, created_at) FROM stdin;
\.


--
-- Data for Name: task_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_items (id, task_id, order_item_id, quantity, is_completed, completed_at, quality_approved, quality_notes) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, phone, name, email, role, is_active, telegram_id, shop_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: warehouse_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_items (id, sku, batch_code, variety, height_cm, farm, supplier, delivery_date, created_at, updated_at, currency, rate, cost, recommended_price, price, markup_pct, qty, reserved_qty, on_showcase, to_write_off, hidden, updated_by, supply_item_id) FROM stdin;
\.


--
-- Data for Name: warehouse_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.warehouse_movements (id, warehouse_item_id, type, quantity, description, reference_type, reference_id, created_at, created_by, qty_before, qty_after) FROM stdin;
\.


--
-- Name: calculator_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calculator_settings_id_seq', 2, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 1, false);


--
-- Name: customer_addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_addresses_id_seq', 1, false);


--
-- Name: customer_important_dates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_important_dates_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, false);


--
-- Name: decorative_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.decorative_materials_id_seq', 1, false);


--
-- Name: deliveries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.deliveries_id_seq', 1, false);


--
-- Name: delivery_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.delivery_positions_id_seq', 1, false);


--
-- Name: florist_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.florist_tasks_id_seq', 1, false);


--
-- Name: flower_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.flower_categories_id_seq', 1, false);


--
-- Name: order_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_history_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_id_seq', 1, false);


--
-- Name: order_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_photos_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: product_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_components_id_seq', 1, false);


--
-- Name: product_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_images_id_seq', 1, false);


--
-- Name: product_ingredients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_ingredients_id_seq', 1, false);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 1, false);


--
-- Name: shops_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shops_id_seq', 2, true);


--
-- Name: supplies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplies_id_seq', 1, false);


--
-- Name: supply_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supply_items_id_seq', 1, false);


--
-- Name: task_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.task_items_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: warehouse_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warehouse_items_id_seq', 1, false);


--
-- Name: warehouse_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.warehouse_movements_id_seq', 1, false);


--
-- Name: customer_addresses _customer_address_uc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT _customer_address_uc UNIQUE (customer_id, address);


--
-- Name: customer_important_dates _customer_date_uc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_important_dates
    ADD CONSTRAINT _customer_date_uc UNIQUE (customer_id, date, description);


--
-- Name: customers _customer_phone_shop_uc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT _customer_phone_shop_uc UNIQUE (phone, shop_id);


--
-- Name: calculator_settings calculator_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calculator_settings
    ADD CONSTRAINT calculator_settings_pkey PRIMARY KEY (id);


--
-- Name: calculator_settings calculator_settings_shop_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calculator_settings
    ADD CONSTRAINT calculator_settings_shop_id_key UNIQUE (shop_id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customer_important_dates customer_important_dates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_important_dates
    ADD CONSTRAINT customer_important_dates_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: decorative_materials decorative_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decorative_materials
    ADD CONSTRAINT decorative_materials_pkey PRIMARY KEY (id);


--
-- Name: deliveries deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliveries
    ADD CONSTRAINT deliveries_pkey PRIMARY KEY (id);


--
-- Name: delivery_positions delivery_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_positions
    ADD CONSTRAINT delivery_positions_pkey PRIMARY KEY (id);


--
-- Name: florist_tasks florist_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.florist_tasks
    ADD CONSTRAINT florist_tasks_pkey PRIMARY KEY (id);


--
-- Name: flower_categories flower_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flower_categories
    ADD CONSTRAINT flower_categories_name_key UNIQUE (name);


--
-- Name: flower_categories flower_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flower_categories
    ADD CONSTRAINT flower_categories_pkey PRIMARY KEY (id);


--
-- Name: order_history order_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_photos order_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_photos
    ADD CONSTRAINT order_photos_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_components product_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_components
    ADD CONSTRAINT product_components_pkey PRIMARY KEY (id);


--
-- Name: product_images product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);


--
-- Name: product_ingredients product_ingredients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: shops shops_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_email_key UNIQUE (email);


--
-- Name: shops shops_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shops
    ADD CONSTRAINT shops_pkey PRIMARY KEY (id);


--
-- Name: supplies supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplies
    ADD CONSTRAINT supplies_pkey PRIMARY KEY (id);


--
-- Name: supply_items supply_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_items
    ADD CONSTRAINT supply_items_pkey PRIMARY KEY (id);


--
-- Name: task_items task_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_items
    ADD CONSTRAINT task_items_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warehouse_items warehouse_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_items
    ADD CONSTRAINT warehouse_items_pkey PRIMARY KEY (id);


--
-- Name: warehouse_movements warehouse_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_movements
    ADD CONSTRAINT warehouse_movements_pkey PRIMARY KEY (id);


--
-- Name: ix_calculator_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_calculator_settings_id ON public.calculator_settings USING btree (id);


--
-- Name: ix_comments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_comments_id ON public.comments USING btree (id);


--
-- Name: ix_comments_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_comments_order_id ON public.comments USING btree (order_id);


--
-- Name: ix_company_settings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_company_settings_id ON public.company_settings USING btree (id);


--
-- Name: ix_customer_addresses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_addresses_id ON public.customer_addresses USING btree (id);


--
-- Name: ix_customer_important_dates_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customer_important_dates_id ON public.customer_important_dates USING btree (id);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customers_phone ON public.customers USING btree (phone);


--
-- Name: ix_decorative_materials_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_decorative_materials_id ON public.decorative_materials USING btree (id);


--
-- Name: ix_deliveries_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_deliveries_id ON public.deliveries USING btree (id);


--
-- Name: ix_delivery_positions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_delivery_positions_id ON public.delivery_positions USING btree (id);


--
-- Name: ix_florist_tasks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_florist_tasks_id ON public.florist_tasks USING btree (id);


--
-- Name: ix_flower_categories_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_flower_categories_id ON public.flower_categories USING btree (id);


--
-- Name: ix_order_history_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_history_id ON public.order_history USING btree (id);


--
-- Name: ix_order_history_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_history_order_id ON public.order_history USING btree (order_id);


--
-- Name: ix_order_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_items_id ON public.order_items USING btree (id);


--
-- Name: ix_order_photos_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_photos_id ON public.order_photos USING btree (id);


--
-- Name: ix_order_photos_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_order_photos_order_id ON public.order_photos USING btree (order_id);


--
-- Name: ix_orders_customer_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_customer_phone ON public.orders USING btree (customer_phone);


--
-- Name: ix_orders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_orders_id ON public.orders USING btree (id);


--
-- Name: ix_orders_tracking_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_orders_tracking_token ON public.orders USING btree (tracking_token);


--
-- Name: ix_product_components_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_components_id ON public.product_components USING btree (id);


--
-- Name: ix_product_images_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_images_id ON public.product_images USING btree (id);


--
-- Name: ix_product_ingredients_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_product_ingredients_id ON public.product_ingredients USING btree (id);


--
-- Name: ix_products_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_id ON public.products USING btree (id);


--
-- Name: ix_products_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_is_active ON public.products USING btree (is_active);


--
-- Name: ix_products_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_products_name ON public.products USING btree (name);


--
-- Name: ix_shops_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_shops_id ON public.shops USING btree (id);


--
-- Name: ix_shops_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_shops_phone ON public.shops USING btree (phone);


--
-- Name: ix_shops_shop_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_shops_shop_domain ON public.shops USING btree (shop_domain);


--
-- Name: ix_shops_telegram_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_shops_telegram_id ON public.shops USING btree (telegram_id);


--
-- Name: ix_supplies_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_supplies_id ON public.supplies USING btree (id);


--
-- Name: ix_supply_items_flower_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_supply_items_flower_name ON public.supply_items USING btree (flower_name);


--
-- Name: ix_supply_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_supply_items_id ON public.supply_items USING btree (id);


--
-- Name: ix_task_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_task_items_id ON public.task_items USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_phone ON public.users USING btree (phone);


--
-- Name: ix_users_telegram_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_telegram_id ON public.users USING btree (telegram_id);


--
-- Name: ix_warehouse_items_farm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_items_farm ON public.warehouse_items USING btree (farm);


--
-- Name: ix_warehouse_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_items_id ON public.warehouse_items USING btree (id);


--
-- Name: ix_warehouse_items_on_showcase; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_items_on_showcase ON public.warehouse_items USING btree (on_showcase);


--
-- Name: ix_warehouse_items_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_warehouse_items_sku ON public.warehouse_items USING btree (sku);


--
-- Name: ix_warehouse_items_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_items_supplier ON public.warehouse_items USING btree (supplier);


--
-- Name: ix_warehouse_items_to_write_off; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_items_to_write_off ON public.warehouse_items USING btree (to_write_off);


--
-- Name: ix_warehouse_items_variety; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_items_variety ON public.warehouse_items USING btree (variety);


--
-- Name: ix_warehouse_movements_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_movements_created_at ON public.warehouse_movements USING btree (created_at);


--
-- Name: ix_warehouse_movements_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_movements_id ON public.warehouse_movements USING btree (id);


--
-- Name: ix_warehouse_movements_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_warehouse_movements_type ON public.warehouse_movements USING btree (type);


--
-- Name: calculator_settings calculator_settings_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calculator_settings
    ADD CONSTRAINT calculator_settings_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: comments comments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: customer_addresses customer_addresses_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_important_dates customer_important_dates_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_important_dates
    ADD CONSTRAINT customer_important_dates_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customers customers_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: decorative_materials decorative_materials_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.decorative_materials
    ADD CONSTRAINT decorative_materials_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: delivery_positions delivery_positions_delivery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_positions
    ADD CONSTRAINT delivery_positions_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id);


--
-- Name: florist_tasks florist_tasks_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.florist_tasks
    ADD CONSTRAINT florist_tasks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_history order_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_history order_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_history
    ADD CONSTRAINT order_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_items order_items_warehouse_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_warehouse_item_id_fkey FOREIGN KEY (warehouse_item_id) REFERENCES public.warehouse_items(id);


--
-- Name: order_photos order_photos_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_photos
    ADD CONSTRAINT order_photos_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_photos order_photos_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_photos
    ADD CONSTRAINT order_photos_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.users(id);


--
-- Name: orders orders_assigned_florist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_assigned_florist_id_fkey FOREIGN KEY (assigned_florist_id) REFERENCES public.users(id);


--
-- Name: orders orders_courier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_courier_id_fkey FOREIGN KEY (courier_id) REFERENCES public.users(id);


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: orders orders_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: product_components product_components_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_components
    ADD CONSTRAINT product_components_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.decorative_materials(id);


--
-- Name: product_components product_components_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_components
    ADD CONSTRAINT product_components_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_components product_components_warehouse_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_components
    ADD CONSTRAINT product_components_warehouse_item_id_fkey FOREIGN KEY (warehouse_item_id) REFERENCES public.warehouse_items(id);


--
-- Name: product_images product_images_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_images
    ADD CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_ingredients product_ingredients_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_ingredients product_ingredients_warehouse_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_ingredients
    ADD CONSTRAINT product_ingredients_warehouse_item_id_fkey FOREIGN KEY (warehouse_item_id) REFERENCES public.warehouse_items(id);


--
-- Name: products products_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: supply_items supply_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_items
    ADD CONSTRAINT supply_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.flower_categories(id);


--
-- Name: supply_items supply_items_supply_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supply_items
    ADD CONSTRAINT supply_items_supply_id_fkey FOREIGN KEY (supply_id) REFERENCES public.supplies(id);


--
-- Name: task_items task_items_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_items
    ADD CONSTRAINT task_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: task_items task_items_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_items
    ADD CONSTRAINT task_items_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.florist_tasks(id);


--
-- Name: users users_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id);


--
-- Name: warehouse_items warehouse_items_supply_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_items
    ADD CONSTRAINT warehouse_items_supply_item_id_fkey FOREIGN KEY (supply_item_id) REFERENCES public.supply_items(id);


--
-- Name: warehouse_movements warehouse_movements_warehouse_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_movements
    ADD CONSTRAINT warehouse_movements_warehouse_item_id_fkey FOREIGN KEY (warehouse_item_id) REFERENCES public.warehouse_items(id);


--
-- PostgreSQL database dump complete
--

