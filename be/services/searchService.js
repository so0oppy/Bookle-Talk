// services/searchService.js
const axios = require('axios');
const { Book } = require('../models_before');
require('dotenv').config();

/**
 * 도서 검색 서비스
 * @param {Object} params - 검색 매개변수
 * @param {string} params.query - 검색어
 * @param {string} params.sort - 정렬 기준
 * @param {number} params.page - 페이지 번호
 * @param {number} params.size - 페이지 크기
 * @returns {Promise<Object>} - 검색 결과
 */
const searchBooks = async (params) => {
  try {
    const { query, sort = 'accuracy', page = 1, size = 10 } = params;

    const response = await axios.get('https://dapi.kakao.com/v3/search/book', {
      headers: {
        Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
      },
      params: { query, sort, page, size },
    });

    const books = response.data.documents;

    // DB 저장
    for (const book of books) {
      const isbn = book.isbn?.split(' ')[0]; // ISBN 중복 방지용

      // 이미 존재하는 책은 저장 안함
      const existing = await Book.findOne({ where: { isbn } });
      if (!existing) {
        await Book.create({
          title: book.title,
          authors: book.authors.join(', '),
          publisher: book.publisher,
          thumbnail: book.thumbnail,
          isbn,
          datetime: book.datetime,
          url: book.url,
        });
      }
    }

    return response.data;
  } catch (error) {
    console.error(error.response?.data || error.message)
    throw {
      statusCode: error.response?.status || 500,
      message: error.response?.data?.message || '카카오 API 요청 중 오류가 발생했습니다.',
    };
  }        
};

module.exports = {
  searchBooks
};