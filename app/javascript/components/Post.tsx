import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NewComment from "./NewComment";
import Comment from "./Comment";

const Post = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<{ title: string, author: string, category: string, content: string, upvote: number, downvote: number, id: number, pinned:number }>({
    title: '',
    author: '',
    category: '',
    content: '',
    upvote: 0,
    downvote: 0,
    id: 0,
    pinned: 0
  });
  const [comments, setComments] = useState<{ id: number, body: string, post_id: number, parent_id: number }[]>([]);
  const [body, setBody] = useState("");
  let [upvoted, setUpvoted] = useState(localStorage.getItem(`upvote_${params.id}`) !== null ? JSON.parse(localStorage.getItem(`upvote_${params.id}`)!) : false);
  let [downvoted, setDownvoted] = useState(localStorage.getItem(`downvote_${params.id}`) !== null ? JSON.parse(localStorage.getItem(`downvote_${params.id}`)!) : false);
  let [starred, setStarred] = useState(localStorage.getItem(`star_${params.id}`) !== null ? JSON.parse(localStorage.getItem(`star_${params.id}`)!) : false);

  // Remember if user has already upvoted/downvoted
  useEffect(() => {
    localStorage.setItem(`upvote_${params.id}`, String(upvoted)) 
  }, [upvoted])

  useEffect(() => {
    localStorage.setItem(`downvote_${params.id}`, String(downvoted)) 
  }, [downvoted])

  useEffect(() => {
    localStorage.setItem(`star_${params.id}`, String(starred)) 
  }, [starred])

  // Loading post
  useEffect(() => {
    const url_p = `/api/v1/show/${params.id}`;
    fetch(url_p)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Network response was not ok.");
      })
      .then((response) => setPost(response))
      .catch(() => navigate("/"));
  }, [params.id]);

  // Loading comments
  useEffect(() => {
    const url_c = `/api/v1/index/${params.id}`;
    fetch(url_c)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Network response was not ok.");
      })
      .then((res) => setComments(res.sort((a: { id: number; }, b: { id: number; }) => post.pinned == a.id ? -1 : post.pinned == b.id ? 1 : a.id - b.id)))
      .catch(() => navigate("/"));
    }, [post.pinned]);

  // Accounting for HTML's behaviour
  const addHtmlEntities = (str: string) => {
    return String(str).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  };
  const postContent = addHtmlEntities(post.content);

  // Function to either update (star, upvote, downvote) or delete post
  const changePost = (event: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement, MouseEvent>, action: string, change: string = "upvote", direction: string = "plus") => {
    event.preventDefault()
    let url = `/api/v1/${action}/${params.id}`;
    const destination = action == "destroy" ? "/" : `/posts/${params.id}`
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')!;
    const addOne = (val : number) => val + 1;
    const minusOne = (val: number) => val - 1;
    let request_body = post;
    const changeField = (val : number) => {
      change == "upvote" ? setUpvoted(!upvoted) : setDownvoted(!downvoted)
      return direction == "plus" ? addOne(val) : val >= 1 ? minusOne(val) : val;
    } 
    request_body = change == "upvote" ? {...post, upvote: changeField(post.upvote)} : {...post, downvote: changeField(post.downvote)}
    setPost(request_body)
    console.log(request_body)
    // Function to send DELETE request
    const del = () => fetch(url, {
                        method: "DELETE",
                        headers: {
                          "X-CSRF-Token": token,
                          "Content-Type": "application/json",
                        },
                      });
    // Function to send PUT request
    const update = () => fetch(url, {
                        method: "PUT",
                        headers: {
                          "X-CSRF-Token": token,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(request_body),
                      });
    let request = action === "update" ? update() : del();
    console.log(request_body)
    // Processing DELETE/PUT request
    request
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Network response was not ok.");
      })
      .then((response) => navigate(destination))
      .catch((error) => console.log(error.message));
  };

  const changeStar = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = localStorage.getItem("username");
    const request_body = {
      username: username,
      post_id: params.id
    };
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')!;
    if (!starred) {
      const url = `/api/v1/stars/create`;
      fetch(url, {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request_body),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Network response was not ok.");
        })
        .then((response) => navigate(`/posts/${params.id}`))
        .catch((error) => console.log(error.message));
    } else{
      const url= `/api/v1/stars/destroy`;
      fetch(url, {
        method: "POST",
        headers: {
          "X-CSRF-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request_body),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Network response was not ok.");
        })
        .then((response) => navigate(`/posts/${params.id}`))
        .catch((error) => console.log(error.message));
    }
    setStarred(!starred);
  }

  // Creating a new comment
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = `/api/v1/comments/create`;

    if (body.length == 0)
      return;

    const request_body = {
      body,
      post_id: Number(params.id), 
      parent_id: 0,
      author: localStorage.getItem("username")
    };

    const token = document.getElementsByName("csrf-token")[0].getAttribute('content')!;
    fetch(url, {
      method: "POST",
      headers: {
        "X-CSRF-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request_body),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Network response was not ok.");
      })
      .then((data) => location.reload())
      .catch((error) => console.log(error.message));
  };


  // Rendering comments
  const allComments = comments.filter((comment) => comment.id !== undefined && comment.parent_id === 0).map((comment: any, index: number) => (
    <div key={String(index)} className="row">
      <Comment comment={comment} author = {post.author} />
    </div>
  ));

  const noComments = (
    <div className="d-flex align-items-center justify-content-center">
      <span className="fst-italic fs-5">
        No comments yet. Why not <NewComment text="add one" onSubmit={onSubmit} setBody={setBody}/>?
      </span>
    </div>
  );

  
  
  // Rendering starred property
  const star = () => {
    if (!starred) {
      return (
        <form onSubmit={changeStar} className="m-0 pt-0">
          <button className= "btn fs-4" type="submit">☆</button>
        </form>  
      ) 
    } else {
      return (
        <form onSubmit={changeStar} className="m-0 pt-0">
          <button className= "btn fs-4" type="submit">★</button>
        </form> 
      )
    }
  }

  // Downvote/Upvote Component and Functionality (increase/undo)
  const downVote = () => {
    if (!downvoted) {
      return (
        <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => changePost(event, "update", "downvote")} className="m-0 pt-0">
          <button className= "btn fs-4" type="submit"><img width="30" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAaVJREFUaEPtWUFuAzEIJD9rX5b2ZWleli5SHVkOGANjVRvhyx7iDTMDA3ZyoZOvy8nxUxH47wwiMvBBRFci4qdn/RDR9/EeP8MLQeAWAN8AM/jPMPpDAQSBRwZAFkMROOp/zIAlinf/NMFWsJXq8ALy7i8CVha8inr3VwYqA4MCVUK9INVGa5Alz2NvXULRc74lSuT0ykdu8d4wCxYJxA1iBwH13jALFr2o7CCgCjMLxiXEJLxrBwG+en5JQKxg/BLfd/ulfpmXqbDfHc8iwDGkUtpBwg1+xXBNJImE2hkCmdDK1RTY3PAHRgqQ/kWhIyp1vCWBVglwLCnFCBKh0mnkPQQ0Ehk/pMB7PNCXNcrUafBRAlpnWqrZiadCeLwl1DKRNXXYtGOHixLImBpSOlETjwJ4wXj3myMlk4HZkJM6Exx8yDSKJNakDk9aKwWIDHAMy9Qw0yJNvOIHntT3nSdaVAYaGanOR6KZyf1SUWgC2pBrgaHgkSYeldGuo3DB4F84OSp4jhpW83l+votAP6khf6dqjHYSWFYxs7EIZNRDvHv6DPwC/GVtMYS+tZ0AAAAASUVORK5CYII="/></button>
        </form>  
      )
    } else {
      return (
        <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => changePost(event, "update", "downvote", "minus")} className="m-0 pt-0">
          <button className= "btn fs-4" type="submit"><img width="30" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAVxJREFUaEPtmVEOwiAQRLc305OpJ9ObaVdtQpqywM5QrFl++mEhM7vzKMRJDj6mg+uXMDC6g4wOnETkIiL6bBkPEbnN8/TpHgwDd4f4RbCKP7vVzxVgGHgiAlANYWDOf3QAiWBEKCIE7oQRoYhQRAjZhD9z40OG1PCvdyHvOR8paG6uHrk37w1WB9BsM41k7w2WAeSiwhS/rLWp1TKgEVITvzD06nndElKCWCfpfXfkyIpXUSUD+s7IKJniaw2MNFEscPGFb3ZG8JDdOtM81xrQOXvyUIyOuTUZxO5holp8CwOpp55QN4n3GugJdUuk30VtntAR6ipo1/H2GmBD3RwdL8TrAjCgdotHIsSCGhLPMoBAjUQYgngdJc+X2gUtE2KEBzg6LIg9JmjimQzUQk0V38uABTUMbU8G0rW3oKZAu5eB9EtN+Ts1d0Kmt9Q4inf5KQx0KWvDoofvwAs3Lj8xV3Zs/gAAAABJRU5ErkJggg=="/></button>
        </form>  
      )
    }
  }

  const upVote = () => {
    if (!upvoted) {
      return (
        <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => changePost(event, "update", "upvote")} className="m-0 pt-0">
          <button className= "btn fs-4" type="submit"><img width="30" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAZpJREFUaEPtmeFuwyAMhN0nW/dkW5+s3ZNttRTUlBkOzLlVJPOrUgjcB3fETU5y8HY6uH5JgHfvYOQOnEXkS0R+NsjvCNgoABV/rQR/isiNDREF8GsIVfEKQW0RAGoVtY7V6BBsgJ74AnS5/6DlgQlgiVexH3fvayb2jQbBArBCq4LL+BroGoISahaAFdq9QAuQkgcGQMs6tc+tfssQqwCj4ov/Z/vDI3cFwCvGyoM71F4AFFq0crRQewFQaBEALdQeAK91aihKqGcBWOJpoZ4BYIsvEEuhHgVYDS3KhDvUowCroUUA7lCPAERZhxJqBPAq8e5Q9wBGanvLGmhRLDsiizUr195knon2JXRLlGfcZtHXA7BOBrRSUQDNcXsAraMTQbAtpKuvxZ75RgNNhsTq9doSaMzZ/l0NaLIEMFYgd2C/KGmhDPHj3dHIgfGvT1ooLZQWckXn6abZB9Ns/5eXErNLsnSQLN28KfXU97SHKQPA+79BId7+dlpFlM+p9QcMZKVunY9uLtcZOzA6V0i/BAhZ1olBD78Df9sqbTFsV3baAAAAAElFTkSuQmCC"/></button>
        </form>  
      )
    } else {
      return (
        <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => changePost(event, "update", "upvote", "minus")} className="m-0 pt-0">
          <button className= "btn fs-4" type="submit"><img width="30" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAAVJJREFUaEPtmUESgjAMRcPN9GTqydSTKZmBDdM2afJDgUlXLkD/a//rWJjo5GM6eX5KgNErGLkCNyJ6ENF3gXxGwEYBcPj3JvCdiD5oiCiAXyEoh2cI6IgA4KpwdUoDDoEGaIVfgV7zB5gPSABNeDgECqAkrdR1iNQogJK0EgDEBwRAT3W2UG4IL4AnPMQHDwAivBvCCmCRVnLCJLUVwCKtBGDywQKArI5b6l6AyPAmH3oA9gjfDaEFiJBWckIltRYgQloJQCW1BmDP6nRLLQGMDK/yoQVwhPArRNWHFsCI3te8qPrQAuBDOe8+RxnFrC2AEVtn7RzNx9DiEw1JYs3se6vmyuC6eaFLAM0y167JFZgfYmWFskKeGcgKke8tUe5CWaGskHMLukKFPOcG1cG9NceIXWh9ndp7+OHw1f/52mIgALS/FXJdAoRMa8eXnn4F/pNfQzEzutmhAAAAAElFTkSuQmCC"/></button>
        </form>  
      )
    }
  }
  
  const buttons = () => {
    return (
      <div className="row d-flex justify-content-end">
        <div className="col-auto w-50">
          <button
            type="button"
            className="btn btn-danger w-100 "
            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => changePost(e, "destroy")}
          >
            Delete Post
          </button>
        </div>
        <div className="col-auto w-50">
          <Link to={`/posts/${post.id}/edit`} className="btn btn-warning w-100 ">
            Edit Post
          </Link>
        </div>
      </div>
    )
  }
  console.log(comments)
  // Rendering post
  return (
    <div className="">
      <div className="hero position-relative d-flex align-items-center justify-content-center">
        <div className="overlay bg-dark position-absolute" />
        <h1 className="display-4 position-relative mt-4">
          {post.title}
        </h1>
      </div>
      <div className="container py-4">
        <div className="row d-flex justify-content-center border border-3 border-black pt-2">
          <div className="col col-sm-2 pt-3">
            <p className="lead">Author: {post.author}</p>
          </div>
          <div className="col col-sm-2 pt-3">
            <p className="lead">Category: {post.category}</p>
          </div>
          <div className="col col-sm-2">
            <div className="row d-inline-flex flex-row">
              <div className="col-8 pt-3">
                <p className="lead mb-0">Upvotes: {post.upvote}</p>
              </div>
              <div className="col-2 pt-1 d-flex justify-content-center">
                {upVote()}
              </div>
            </div>
          </div>
          <div className="col col-sm-2">
            <div className="row d-inline-flex flex-row">
              <div className="col-8 pt-3">
                <p className="lead mb-0">Downvotes: {post.downvote}</p>
              </div>
              <div className="col-2 pt-1 d-flex justify-content-center">
                {downVote()}
              </div>
            </div>
          </div>
          <div className="col col-sm-2">
            <div className="row">
              <div className="col col-sm-4 pt-3">
                <p className="lead mb-0">Starred: </p>
              </div>
              <div className="col col-sm-4 pt-2">
                {star()}
              </div>
            </div>
          </div>
        </div>
        <div className="row p-4 border border-3 border-top-0 border-black">
          <div className="col">
            <p className="mb-2 h3">Post Content: </p>
            <div
              dangerouslySetInnerHTML={{
                __html: `${postContent}`,
              }}
            />
          </div>
          <div className="col d-flex flex-column align-self-start">
            {post.author === localStorage.getItem("username") ? buttons() : ""}
            <div className="row d-flex justify-content-end mt-3">
              <div className="col">
                <span className="lead fw-medium">Comments:</span>
              </div>
              <div className="col d-flex justify-content-end">
                <NewComment text="Add Comment" onSubmit={onSubmit} setBody={setBody}/>
              </div>
              {comments.length === 0 ? noComments : allComments}
            </div>
          </div>
        </div>
        <Link to="/" className="btn btn-outline-dark mt-3">
          Back to Posts
        </Link>
      </div>
    </div>
  );
};

export default Post;