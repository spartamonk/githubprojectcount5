import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [followers, setFollowers] = useState(mockFollowers)
  const [repos, setRepos] = useState(mockRepos)
  const [user, setUser] = useState('')
  const [remainingRequests, setRemainingRequests] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({
    isError: false,
    errorMsg: '',
  })

  const toggleError = (isError = false, errorMsg = '') => {
    setError({
      isError,
      errorMsg,
    })
  }
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then((response) => {
        let { remaining } = response.data.rate
        setRemainingRequests(remaining)
        if (remaining === 0) {
          toggleError(true, 'you have used all your hour requests')
        }
      })
      .catch((error) => console.log(error))
  }

  useEffect(checkRequests, [])

  const handleChange = (e) => {
    setUser(e.target.value)
  }
  const fetchUsers = async () => {
    setIsLoading(true)
    toggleError()
    const response = await axios(`${rootUrl}/users/${user}`).catch((error) =>
      console.log(error)
    )
    if (response) {
      const { data } = response
      setGithubUser(data)
      const { login, followers_url } = data
      // axios(`${followers_url}?per_page=100`)
      //   .then((response) => setFollowers(response.data))
      //   .catch((error) => console.log(error))
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`)
      //   .then((response) => setRepos(response.data))
      //   .catch((error) => console.log(error))
      await Promise.allSettled([
        axios(`${followers_url}?per_page=100`),
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
      ]).then(([followers, repos])=> {
        const status= 'fulfilled'
        if(followers.status === status) {
          setFollowers(followers.value.data)
        }
        if(repos.status === status) {
          setRepos(repos.value.data)
        }
      } ).catch(error=> console.log(error))
    } else {
      toggleError(true, 'There Is No User With That Username')
    }
    setIsLoading(false)
    checkRequests()
  }
  const handleSubmit = (e) => {
    e.preventDefault()
    if (user) {
      fetchUsers()
    }
  }

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        followers,
        repos,
        isLoading,
        ...error,
        remainingRequests,
        user,
        handleChange,
        handleSubmit,
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

const useGlobalContext = () => {
  return React.useContext(GithubContext)
}

export { useGlobalContext, GithubProvider }
