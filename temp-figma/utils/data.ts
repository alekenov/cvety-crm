import imgImage6 from "figma:asset/4627ef1be52e72e761143c7f24c10d83d8c975c1.png";
import imgImage7 from "figma:asset/8f0d4d209664689a8b6c75d7fc29ec4ea97e7930.png";
import { Product, AddonProduct } from "../types";

export const showcaseProducts: Product[] = [
  {
    id: 1,
    image: imgImage6,
    price: "7 900 ₸",
    title: "Розовые розы премиум",
    delivery: "Сегодня к 18:00",
    tag: "Хит",
    tagVariant: "default"
  },
  {
    id: 2,
    image: imgImage7,
    price: "12 500 ₸", 
    title: "Свадебный букет из пионов",
    delivery: "Завтра к 12:00",
    tag: "Премиум",
    tagVariant: "new"
  }
];

export const availableProducts: Product[] = [
  {
    id: 3,
    image: imgImage6,
    price: "5 500 ₸",
    title: "Белые хризантемы",
    delivery: "Сегодня к 20:00"
  },
  {
    id: 4,
    image: imgImage7,
    price: "6 700 ₸",
    title: "Композиция из пионов",
    delivery: "Сегодня к 19:00"
  },
  {
    id: 5,
    image: imgImage6,
    price: "4 200 ₸",
    title: "Тюльпаны микс",
    delivery: "Сегодня к 21:00"
  }
];

export const promoProducts: Product[] = [
  {
    id: 6,
    image: imgImage7,
    price: "4 900 ₸",
    title: "Розы Эквадор со скидкой",
    delivery: "Завтра к 15:30",
    tag: "-30%",
    tagVariant: "promo"
  },
  {
    id: 7,
    image: imgImage6,
    price: "3 500 ₸",
    title: "Альстромерии акция",
    delivery: "Завтра к 16:00",
    tag: "-30%",
    tagVariant: "promo"
  }
];

export const catalogProducts: Product[] = [
  {
    id: 8,
    image: imgImage6,
    price: "8 100 ₸",
    title: "Букет из альстромерий",
    delivery: "Завтра к 16:00"
  },
  {
    id: 9,
    image: imgImage7,
    price: "9 200 ₸",
    title: "Букет тюльпанов к 8 марта",
    delivery: "Завтра к 12:00"
  },
  {
    id: 10,
    image: imgImage6,
    price: "6 500 ₸",
    title: "Смешанный букет весенний",
    delivery: "Послезавтра к 15:00"
  },
  {
    id: 11,
    image: imgImage7,
    price: "11 200 ₸",
    title: "Композиция в коробке",
    delivery: "Завтра к 18:00"
  }
];

export const addonProducts: AddonProduct[] = [
  {
    id: 1001,
    image: imgImage6,
    price: "1 200 ₸",
    title: "Конфеты Ferrero Rocher",
    category: "chocolate"
  },
  {
    id: 1002,
    image: imgImage7,
    price: "800 ₸",
    title: "Шоколад Lindt",
    category: "chocolate"
  },
  {
    id: 1003,
    image: imgImage6,
    price: "1 500 ₸",
    title: "Мини-букет роз",
    category: "mini_bouquet"
  },
  {
    id: 1004,
    image: imgImage7,
    price: "600 ₸",
    title: "Леденцы ассорти",
    category: "candy"
  },
  {
    id: 1005,
    image: imgImage6,
    price: "900 ₸",
    title: "Трюфели Belgium",
    category: "chocolate"
  },
  {
    id: 1006,
    image: imgImage7,
    price: "1 100 ₸",
    title: "Мини-композиция",
    category: "mini_bouquet"
  }
];

export const reviews = [
  {
    author: "Анна К.",
    rating: 5,
    text: "Потрясающие букеты! Заказывала розы на день рождения - пришли точно в срок, очень свежие и красивые.",
    date: "3 дня назад"
  },
  {
    author: "Михаил С.", 
    rating: 5,
    text: "Отличный сервис, быстрая доставка. Композиция из пионов превзошла все ожидания.",
    date: "1 неделю назад"
  }
];